import debounce from "lodash.debounce"
import { PointerEventHandler, PureComponent } from "react"
import ReactDom from "react-dom"

import {
  EventBus, PDFLinkService, PDFViewer
} from "pdfjs-dist/legacy/web/pdf_viewer"

import "pdfjs-dist/web/pdf_viewer.css"
import "../style/pdf_viewer.css"

import "../style/PdfHighlighter.css"

import getAreaAsPng from "../lib/get-area-as-png"
import getBoundingRect from "../lib/get-bounding-rect"
import getClientRects from "../lib/get-client-rects"

import {
  asElement, findOrCreateContainerLayer, getPageFromElement, getPagesFromRange, getWindow, isHTMLElement
} from "../lib/pdfjs-dom"

import MouseSelection from "./MouseSelection"
import TipContainer from "./TipContainer"

import { intersectDOMRect, scaledToViewport, viewportToScaled, domRectFromRect } from "../lib/coordinates"
import { postprocessingText } from "../lib/text-tools"

import type { PDFDocumentProxy } from "pdfjs-dist"
import type {
  IHighlight, LeftTopWidthHeight,
  LeftTopWidthHeightPageNumber, Position, Scaled, ScaledPosition
} from "../types"

type T_ViewportHighlight<T_HT> = { position: Position } & T_HT

interface State<T_HT> {
  ghostHighlights: Array<{
    position: ScaledPosition
    content?: { text?: string, image?: string }
  }>
  isCollapsed: boolean
  range: Range | null
  tip: {
    highlight: T_ViewportHighlight<T_HT>
    callback: (highlight: T_ViewportHighlight<T_HT>) => JSX.Element
  } | null
  tipPosition: Position | null
  tipChildren: JSX.Element | null
  isAreaSelectionInProgress: boolean
  scrolledToHighlightId: string
}

interface Props<T_HT> {
  highlightTransform: (
    highlight: T_ViewportHighlight<T_HT>,
    index: number,
    setTip: (
      highlight: T_ViewportHighlight<T_HT>,
      callback: (highlight: T_ViewportHighlight<T_HT>) => JSX.Element
    ) => void,
    hideTip: () => void,
    viewportToScaled: (rect: LeftTopWidthHeightPageNumber) => Scaled,
    screenshot: (position: LeftTopWidthHeight) => string,
    isScrolledTo: boolean
  ) => JSX.Element
  highlights: Array<T_HT>
  onScrollChange: () => void
  scrollRef: (scrollTo: (highlight: IHighlight) => void) => void
  pdfDocument: PDFDocumentProxy
  pdfScaleValue: string
  onSelectionFinished: (
    positions: Array<ScaledPosition>,
    contents: Array<{ text?: string, image?: string }>,
    hideTipAndSelection: () => void,
    transformSelection: () => void,
    hideTipOnly: () => void,
  ) => JSX.Element | null
  enableAreaSelection: (event: MouseEvent) => boolean
}

const EMPTY_ID = "empty-id"

export class PdfHighlighter<T_HT extends IHighlight> extends PureComponent<
  Props<T_HT>,
  State<T_HT>
> {
  static defaultProps = {
    pdfScaleValue: "auto",
  }

  state: State<T_HT> = {
    ghostHighlights: [],
    isCollapsed: true,
    range: null,
    scrolledToHighlightId: EMPTY_ID,
    isAreaSelectionInProgress: false,
    tip: null,
    tipPosition: null,
    tipChildren: null,
  }

  eventBus = new EventBus();
  linkService = new PDFLinkService({
    eventBus: this.eventBus,
    externalLinkTarget: 2,
  })

  viewer!: PDFViewer

  resizeObserver: ResizeObserver | null = null
  containerNode?: HTMLDivElement | null = null
  unsubscribe = () => { }

  constructor(props: Props<T_HT>) {
    super(props)
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.debouncedScaleValue)
    }
  }

  componentDidMount() {
    this.init()
  }

  attachRef = (ref: HTMLDivElement | null) => {
    const { eventBus, resizeObserver: observer } = this
    this.containerNode = ref
    this.unsubscribe()

    if (ref) {
      const { ownerDocument: doc } = ref
      eventBus.on("textlayerrendered", this.onTextLayerRendered)
      eventBus.on("pagesinit", this.onDocumentReady)
      doc.addEventListener("selectionchange", this.onSelectionChange)
      doc.addEventListener("keydown", this.handleKeyDown)
      doc.defaultView?.addEventListener("resize", this.debouncedScaleValue)
      if (observer) observer.observe(ref)

      this.unsubscribe = () => {
        eventBus.off("pagesinit", this.onDocumentReady)
        eventBus.off("textlayerrendered", this.onTextLayerRendered)
        doc.removeEventListener("selectionchange", this.onSelectionChange)
        doc.removeEventListener("keydown", this.handleKeyDown)
        doc.defaultView?.removeEventListener(
          "resize",
          this.debouncedScaleValue
        )
        if (observer) observer.disconnect()
      }
    }
  }

  componentDidUpdate(prevProps: Props<T_HT>) {
    if (prevProps.pdfDocument !== this.props.pdfDocument) {
      this.init()
      return
    }
    if (prevProps.highlights !== this.props.highlights) {
      this.renderHighlights(this.props)
    }
  }

  init() {
    const { pdfDocument } = this.props

    this.viewer =
      this.viewer ||
      new PDFViewer({
        container: this.containerNode!,
        eventBus: this.eventBus,
        // enhanceTextSelection: true, // deprecated. https://github.com/mozilla/pdf.js/issues/9943#issuecomment-409369485
        textLayerMode: 1, // Only simple layer, @notice z-index: -1 on the styles
        removePageBorders: true,
        linkService: this.linkService,
        renderer: "canvas",
        l10n: null,
      })

    this.linkService.setDocument(pdfDocument)
    this.linkService.setViewer(this.viewer)
    this.viewer.setDocument(pdfDocument);

    // debug
    (window as any).PdfViewer = this
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  findOrCreateHighlightLayer(page: number) {
    const pageView = this.viewer.getPageView(page - 1) || {}

    if (!pageView || !pageView.div) {
      return null
    }

    return findOrCreateContainerLayer(
      pageView.div,
      "PdfHighlighter__highlight-layer"
    );
  }

  groupHighlightsByPage(highlights: Array<T_HT>): {
    [pageNumber: string]: Array<T_HT>
  } {
    const { ghostHighlights } = this.state;

    const allHighlights = [...highlights, ...ghostHighlights].filter(Boolean)

    const pageNumbers = new Set<number>()
    for (const highlight of allHighlights) {
      if (highlight!.position.pageNumber) {
        pageNumbers.add(highlight!.position.pageNumber)
      }
      if (highlight!.position.boundingRect?.pageNumber) {
        pageNumbers.add(highlight!.position.boundingRect.pageNumber)
      }
      if (highlight!.position.rects) {
        for (const rect of highlight!.position.rects) {
          if (rect.pageNumber) {
            pageNumbers.add(rect.pageNumber)
          }
        }
      }
    }

    const groupedHighlights = {} as Record<number, any[]>

    for (const pageNumber of Array.from(pageNumbers)) {
      groupedHighlights[pageNumber] = groupedHighlights[pageNumber] || []
      for (const highlight of allHighlights) {
        const pageSpecificHighlight = {
          ...highlight,
          position: {
            pageNumber,
            boundingRect: highlight!.position.boundingRect,
            rects: [],
            usePdfCoordinates: highlight!.position.usePdfCoordinates,
          } as ScaledPosition,
        }
        let anyRectsOnPage = false;
        if (highlight!.position.rects) {
          for (const rect of highlight!.position.rects) {
            if (
              pageNumber === (rect.pageNumber || highlight!.position.pageNumber)
            ) {
              pageSpecificHighlight.position.rects.push(rect)
              anyRectsOnPage = true
            }
          }
        }
        if (highlight!.position.pageNumber) {
          if (anyRectsOnPage || pageNumber === highlight!.position.pageNumber) {
            groupedHighlights[pageNumber].push(pageSpecificHighlight)
          }
        }
        if (highlight!.position.boundingRect?.pageNumber) {
          if (anyRectsOnPage || pageNumber === highlight!.position.boundingRect?.pageNumber) {
            groupedHighlights[pageNumber].push(pageSpecificHighlight)
          }
        }
      }
    }

    return groupedHighlights
  }

  showTip(highlight: T_ViewportHighlight<T_HT>, content: JSX.Element) {
    const { isCollapsed, ghostHighlights, isAreaSelectionInProgress } =
      this.state

    const highlightInProgress = !isCollapsed || ghostHighlights

    if (highlightInProgress || isAreaSelectionInProgress) {
      return
    }

    this.setTip(highlight.position, content)
  }

  scaledPositionToViewport({
    pageNumber,
    boundingRect,
    rects,
    usePdfCoordinates,
  }: ScaledPosition): Position {
    const viewport = this.viewer.getPageView(pageNumber - 1).viewport

    return {
      boundingRect: scaledToViewport(boundingRect, viewport, usePdfCoordinates),
      rects: (rects || []).map((rect) =>
        scaledToViewport(rect, viewport, usePdfCoordinates)
      ),
      pageNumber,
    }
  }

  viewportPositionToScaled({
    pageNumber,
    boundingRect,
    rects,
  }: Position): ScaledPosition {
    const viewport = this.viewer.getPageView(pageNumber - 1).viewport

    return {
      boundingRect: viewportToScaled(boundingRect, viewport),
      rects: (rects || []).map((rect) => viewportToScaled(rect, viewport)),
      pageNumber,
    }
  }

  screenshot(position: LeftTopWidthHeight, pageNumber: number) {
    const canvas = this.viewer.getPageView(pageNumber - 1).canvas

    return getAreaAsPng(canvas, position)
  }

  renderHighlights(nextProps?: Props<T_HT>) {
    const { highlightTransform, highlights } = nextProps || this.props

    const { pdfDocument } = this.props

    const { tip, scrolledToHighlightId } = this.state

    const highlightsByPage = this.groupHighlightsByPage(highlights)

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      const highlightLayer = this.findOrCreateHighlightLayer(pageNumber)

      if (highlightLayer) {
        ReactDom.render(
          <div>
            {(highlightsByPage[String(pageNumber)] || []).map(
              ({ position, id, ...highlight }, index) => {
                // @ts-ignore
                const viewportHighlight: T_ViewportHighlight<T_HT> = {
                  id,
                  position: this.scaledPositionToViewport(position),
                  ...highlight,
                }

                if (tip && tip.highlight.id === String(id)) {
                  this.showTip(tip.highlight, tip.callback(viewportHighlight))
                }

                const isScrolledTo = Boolean(scrolledToHighlightId === id)

                return highlightTransform(
                  viewportHighlight,
                  index,
                  (highlight, callback) => {
                    this.setState({
                      tip: { highlight, callback },
                    })

                    this.showTip(highlight, callback(highlight))
                  },
                  this.hideTipAndSelection,
                  (rect) => {
                    const viewport = this.viewer.getPageView(
                      (rect.pageNumber || pageNumber) - 1
                    ).viewport

                    return viewportToScaled(rect, viewport)
                  },
                  (boundingRect) => this.screenshot(boundingRect, pageNumber),
                  isScrolledTo
                )
              }
            )}
          </div>,
          highlightLayer
        )
      }
    }
  }

  hideTipAndSelection = () => {
    this.setState({
      tipPosition: null,
      tipChildren: null,
    })

    this.setState({
        ghostHighlights: [],
        tip: null 
      }, () =>
      this.renderHighlights()
    )
  }

  hideTipOnly = () => {
    this.setState({
      tipPosition: null,
      tipChildren: null,
    })
  }

  setTip(position: Position, inner: JSX.Element | null) {
    this.setState({
      tipPosition: position,
      tipChildren: inner,
    })
  }

  renderTip = () => {
    const { tipPosition, tipChildren } = this.state
    
    if (!tipPosition) {
      return null
    }

    const { boundingRect, pageNumber } = tipPosition
    const page = {
      node: this.viewer.getPageView((boundingRect.pageNumber || pageNumber) - 1)
        .div,
      pageNumber: boundingRect.pageNumber || pageNumber,
    }

    const pageBoundingClientRect = page.node.getBoundingClientRect()

    const pageBoundingRect = {
      bottom: pageBoundingClientRect.bottom,
      height: pageBoundingClientRect.height,
      left: pageBoundingClientRect.left,
      right: pageBoundingClientRect.right,
      top: pageBoundingClientRect.top,
      width: pageBoundingClientRect.width,
      x: pageBoundingClientRect.x,
      y: pageBoundingClientRect.y,
      pageNumber: page.pageNumber,
    }

    return (
      <TipContainer
        scrollTop={this.viewer.container.scrollTop}
        pageBoundingRect={pageBoundingRect}
        style={{
          left:
            page.node.offsetLeft + boundingRect.left + boundingRect.width / 2,
          top: boundingRect.top + page.node.offsetTop,
          bottom: boundingRect.top + page.node.offsetTop + boundingRect.height,
        }}
      >
        {tipChildren}
      </TipContainer>
    )
  }

  onTextLayerRendered = () => {
    this.renderHighlights()
  }

  scrollTo = (highlight: IHighlight) => {
    const boundingRect = highlight.position.boundingRect
    const pageNumber = highlight.position.pageNumber || boundingRect.pageNumber || 1
    const usePdfCoordinates = highlight.position.usePdfCoordinates

    this.viewer.container.removeEventListener("scroll", this.onScroll)

    const pageViewport = this.viewer.getPageView(pageNumber - 1).viewport

    const scrollMargin = 10

    this.viewer.scrollPageIntoView({
      pageNumber,
      destArray: [
        null,
        { name: "XYZ" },
        ...pageViewport.convertToPdfPoint(
          0,
          scaledToViewport(boundingRect, pageViewport, usePdfCoordinates).top - scrollMargin
        ),
        0,
      ],
    })

    this.setState(
      {
        scrolledToHighlightId: highlight.id,
      },
      () => this.renderHighlights()
    )

    // wait for scrolling to finish
    setTimeout(() => {
      this.viewer.container.addEventListener("scroll", this.onScroll)
    }, 100)
  }

  onDocumentReady = () => {
    const { scrollRef } = this.props

    this.handleScaleValue()

    scrollRef(this.scrollTo)
  }

  onSelectionChange = () => {
    const container = this.containerNode
    const selection = getWindow(container).getSelection()

    if (!selection) {
      return
    }

    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null

    if (selection.isCollapsed) {
      this.setState({ isCollapsed: true })
      return
    }

    if (
      !range ||
      !container ||
      !container.contains(range.commonAncestorContainer)
    ) {
      return
    }

    this.setState({
      isCollapsed: false,
      range: range,
    })

    // this.debouncedAfterSelection()
  }

  onScroll = () => {
    const { onScrollChange } = this.props

    onScrollChange()

    this.setState(
      {
        scrolledToHighlightId: EMPTY_ID,
      },
      () => this.renderHighlights()
    )

    this.viewer.container.removeEventListener("scroll", this.onScroll)
  }

  onMouseDown: PointerEventHandler = (event) => {
    if (!isHTMLElement(event.target)) {
      return
    }

    if (asElement(event.target).closest(".PdfHighlighter__tip-container")) {
      return
    }

    this.hideTipAndSelection()
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Escape") {
      this.hideTipAndSelection()
    }
  }

  afterSelection = () => {
    const { onSelectionFinished } = this.props

    const { isCollapsed, range } = this.state

    if (!range || isCollapsed) {
      return
    }

    const pages = getPagesFromRange(range)

    if (!pages || pages.length === 0) {
      return
    }

    const rects = getClientRects(range, pages)

    if (rects.length === 0) {
      return
    }

    const boundingRect = getBoundingRect(rects)

    const viewportPosition: Position = {
      boundingRect,
      rects,
      pageNumber: pages[0].number,
    }

    const content = {
      text: range.toString(),
    }
    const scaledPosition = this.viewportPositionToScaled(viewportPosition)

    this.setTip(
      viewportPosition,
      onSelectionFinished(
        [scaledPosition],
        [content],
        () => this.hideTipAndSelection(),
        () =>
          this.setState(
            {
              ghostHighlights: [{ position: scaledPosition }],
            },
            () => this.renderHighlights()
          ),
        () => this.hideTipOnly(),
      )
    )
  }

  debouncedAfterSelection: () => void = debounce(this.afterSelection, 500)

  toggleTextSelection(flag: boolean) {
    this.viewer.viewer!.classList.toggle(
      "PdfHighlighter--disable-selection",
      flag
    )
  }

  handleScaleValue = () => {
    if (this.viewer) {
      this.viewer.currentScaleValue = this.props.pdfScaleValue; //"page-width"
    }
  }

  debouncedScaleValue: () => void = debounce(this.handleScaleValue, 500)

  render() {
    const { onSelectionFinished, enableAreaSelection } = this.props
    const self = this

    return (
      <div onPointerDown={this.onMouseDown}>
        <div
          ref={this.attachRef}
          className="PdfHighlighter"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="pdfViewer" />
          {this.renderTip()}
          {typeof enableAreaSelection === "function" ? (
            <MouseSelection
              onDragStart={() => this.toggleTextSelection(false)}
              onDragEnd={() => this.toggleTextSelection(false)}
              onChange={(isVisible) =>
                this.setState({ isAreaSelectionInProgress: isVisible })
              }
              shouldStart={(event) =>
                enableAreaSelection(event) &&
                isHTMLElement(event.target) &&
                Boolean(asElement(event.target).closest(".page"))
              }
              onSelection={(startTarget, finishTarget, boundingRect, resetSelection) => {
                const startPage = getPageFromElement(startTarget)
                const finishPage = getPageFromElement(finishTarget)

                if (!startPage) {
                  return
                }

                const startPageBoundingRect = {
                  ...boundingRect,
                  top: boundingRect.top - startPage.node.offsetTop,
                  left: boundingRect.left - startPage.node.offsetLeft,
                  pageNumber: startPage.number,
                }

                const startViewportPosition = {
                  boundingRect: startPageBoundingRect,
                  rects: [],
                  pageNumber: startPage.number,
                }

                const startScaledPosition =
                  this.viewportPositionToScaled(startViewportPosition);

                const startImage = this.screenshot(
                  startPageBoundingRect,
                  startPageBoundingRect.pageNumber
                )

                let startText = '-'

                const startPageView = self.viewer.getPageView(startPage.number - 1) || {};
                if (startPageView.textLayer) {
                  startPageView.textLayer?.textLayerDiv?.childNodes.forEach(function check(child: any) {
                    const textContainer = child.parentElement
                    if (child.nodeType === Node.TEXT_NODE && (
                      intersectDOMRect(domRectFromRect({
                        top: textContainer.offsetTop,
                        left: textContainer.offsetLeft,
                        width: textContainer.offsetWidth,
                        height: textContainer.offsetHeight,
                      }), domRectFromRect(startPageBoundingRect)))) {
                      startText += child.nodeValue.trim() + ' '
                    }
                    child.childNodes.forEach(check)
                  })
                  //console.log(`Text is ${text}`)
                }

                const positions = [startScaledPosition]
                const contents = [{ text: postprocessingText(startText), image: startImage }]
                const ghostHighlights = [{
                  position: startScaledPosition,
                  content: { text: postprocessingText(startText), image: startImage },
                }]

                if (startTarget !== finishTarget && finishPage) {
                  console.debug(`The selection has the two rectangles`)
                  const finishPageBoundingRect = {
                    ...boundingRect,
                    top: boundingRect.top - finishPage.node.offsetTop,
                    left: boundingRect.left - finishPage.node.offsetLeft,
                    pageNumber: finishPage.number,
                  }

                  const finishViewportPosition = {
                    boundingRect: finishPageBoundingRect,
                    rects: [],
                    pageNumber: finishPage.number,
                  }

                  const finishScaledPosition =
                    this.viewportPositionToScaled(finishViewportPosition);

                  const finishImage = this.screenshot(
                    finishPageBoundingRect,
                    finishPageBoundingRect.pageNumber
                  )

                  let finishText = '-'

                  const finishPageView = self.viewer.getPageView(finishPage.number - 1) || {};
                  if (finishPageView.textLayer) {
                    finishPageView.textLayer?.textLayerDiv?.childNodes.forEach(function check(child: any) {
                      const textContainer = child.parentElement
                      if (child.nodeType === Node.TEXT_NODE && (
                        intersectDOMRect(domRectFromRect({
                          top: textContainer.offsetTop,
                          left: textContainer.offsetLeft,
                          width: textContainer.offsetWidth,
                          height: textContainer.offsetHeight,
                        }), domRectFromRect(finishPageBoundingRect)))) {
                        finishText += child.nodeValue.trim() + ' '
                      }
                      child.childNodes.forEach(check)
                    })
                    //console.log(`Text is ${text}`)
                  }

                  // Update arrays
                  positions.push(finishScaledPosition)
                  contents.push({ text: postprocessingText(finishText), image: finishImage })
                  ghostHighlights.push({
                    position: finishScaledPosition,
                    content: { text: postprocessingText(finishText), image: finishImage },
                  })
                }

                this.setTip(
                  startViewportPosition,
                  onSelectionFinished(
                    positions,
                    contents,
                    () => this.hideTipAndSelection(),
                    () =>
                      this.setState(
                        {
                          ghostHighlights: ghostHighlights,
                        },
                        () => {
                          resetSelection()
                          this.renderHighlights()
                        }
                      ),
                    () => this.hideTipOnly(),
                  )
                )
              }}
            />
          ) : null}
        </div>
      </div>
    )
  }
}
