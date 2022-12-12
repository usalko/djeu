// import { min } from "lodash";
import { Component } from "react";
import { IHighlight, NewHighlight } from "../types";
import { AreaHighlight } from './AreaHighlight';
import { PdfHighlighter } from './PdfHighlighter';
import { PdfLoader } from './PdfLoader';
import { Popup } from './Popup';
import { Spinner } from "./Spinner";
// import { testHighlights as _testHighlights } from "./test-highlights";
import { Tip, ChangeMode } from './Tip';

// const highlightsStore: Record<string, Array<IHighlight>> = _testHighlights;

export interface State {
  url: string
  highlights: Array<IHighlight>
  changeMode: ChangeMode,
  selectedIndex: number,
  memoHighlights: Array<IHighlight>, // Highlights for the complex selection (as an example: chain of highlights)
  lastHighlightsCount: number, // Count of added highlights
}
const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};
const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; emoji: string };
}) =>
  comment?.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

// const PRIMARY_PDF_URL = "files/vedomosti_spb_1727.pdf";
// const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480.pdf";
// const initialUrl = SECONDARY_PDF_URL;
// console.log(initialUrl);

class PDFwrapper extends Component<{}, State> {

  // FIXME: Add listeners not for window level but element level only
  setUrlListener: any
  setHighlightsListener: any
  cancelLatestHighlightsListener: any
  selectHighlightsListener: any
  editHighlightsListener: any
  removeHighlightsListener: any
  afterPersistHighlightsListener: any
  cancelEditHighlightsListener: any
  debugEnabled = true

  constructor(props: any) {
    super(props)
    this.state = {
      url: props.url,
      highlights: props.highlights || [],
      changeMode: ChangeMode.AddNew,
      selectedIndex: -1,
      memoHighlights: [],
      lastHighlightsCount: 0,
    }
  }

  resetHighlights = () => {
    this.setState({
      highlights: [],
      changeMode: ChangeMode.AddNew,
      selectedIndex: -1,
    })
  }

  toggleDocument = (newUrl: string) => {
    this.setState({
      url: newUrl,
      highlights: [],
      changeMode: ChangeMode.AddNew,
      selectedIndex: -1,
      memoHighlights: [],
    })
  }

  scrollViewerTo = (highlight: any) => { }

  scrollToHighlightFromHash = () => {
    const highlight = this.getHighlightById(parseIdFromHash())

    if (highlight) {
      this.scrollViewerTo(highlight)
    }
  }

  componentDidMount() {
    // FIXME: Add listener snot for window level but element level only
    window.addEventListener(
      "hashchange",
      this.scrollToHighlightFromHash,
      false
    )

    // FIXME: Add listener snot for window level but element level only
    if (!this.setUrlListener) {
      this.setUrlListener = window.addEventListener('jquery-pdf-viewer:setPDFwrapperUrl',
        (e: Event) => {
          if (e instanceof CustomEvent) {
            if (this.debugEnabled) { console.debug(e) }
            if (e?.detail?.url) {
              this.toggleDocument(e?.detail?.url)
            }
          }
        },
        false
      )
    }
    if (!this.setHighlightsListener) {
      this.setHighlightsListener = window.addEventListener('jquery-pdf-viewer:setHighlights',
        (e: Event) => {
          // console.debug(e)
          if ((e as CustomEvent).detail?.highlights) {
            this.setHighlights(JSON.parse((e as CustomEvent).detail.highlights))
          }
        },
        false
      )
    }
    if (!this.cancelLatestHighlightsListener) {
      this.cancelLatestHighlightsListener = window.addEventListener('pdf-viewer-integration:cancelLatestHighlights',
        (e: Event) => {
          if (this.debugEnabled) { console.debug(e) }
          this.cancelLatestHighlight()
        },
        false
      )
    }
    if (!this.selectHighlightsListener) {
      this.selectHighlightsListener = window.addEventListener('pdf-viewer-integration:selectHighlights',
        (e: Event) => {
          if (this.debugEnabled) { console.debug(e) }
          if ('detail' in e && (e as CustomEvent).detail?.highlights) {
            const highlights = JSON.parse((e as CustomEvent).detail.highlights)
            this.selectHighlights(Array.isArray(highlights) ? highlights : [highlights])
          }
        },
        false
      )
    }
    if (!this.editHighlightsListener) {
      this.editHighlightsListener = window.addEventListener('pdf-viewer-integration:editHighlights',
        (e: Event) => {
          if (this.debugEnabled) { console.debug(e) }
          if ('detail' in e && (e as CustomEvent).detail?.highlights) {
            const highlights = JSON.parse((e as CustomEvent).detail.highlights)
            this.editHighlights(Array.isArray(highlights) ? highlights : [highlights])
          }
        },
        false
      )
    }
    if (!this.removeHighlightsListener) {
      this.removeHighlightsListener = window.addEventListener('pdf-viewer-integration:removeHighlights',
        (e: Event) => {
          if (this.debugEnabled) { console.debug(e) }
          if ('detail' in e && (e as CustomEvent).detail?.highlights) {
            const highlights = JSON.parse((e as CustomEvent).detail.highlights)
            this.removeHighlights(Array.isArray(highlights) ? highlights : [highlights])
          }
        },
        false
      )
    }
    if (!this.afterPersistHighlightsListener) {
      this.afterPersistHighlightsListener = window.addEventListener('pdf-viewer-integration:afterPersistHighlights',
        (e: Event) => {
          if (this.debugEnabled) { console.debug(e) }
          if ('detail' in e && (e as CustomEvent).detail?.highlights) {
            const highlights = JSON.parse((e as CustomEvent).detail.highlights)
            this.afterPersistHighlights(Array.isArray(highlights) ? highlights : [highlights])
          }
        },
        false
      )
    }
    if (!this.cancelEditHighlightsListener) {
      this.cancelEditHighlightsListener = window.addEventListener('pdf-viewer-integration:cancelEditHighlights',
        (e: Event) => {
          if (this.debugEnabled) { console.debug(e) }
          if ('detail' in e && (e as CustomEvent).detail?.highlights) {
            const highlights = JSON.parse((e as CustomEvent).detail.highlights)
            this.cancelEditHighlights(Array.isArray(highlights) ? highlights : [highlights])
          }
        },
        false
      )
    }
  }

  getHighlightById(id: string) {
    const { highlights } = this.state;

    return highlights.find((highlight) => highlight.id === id)
  }

  hasId(object: any): object is IHighlight {
    return 'id' in object
  }

  setHighlights(uploadedHighlights: Array<IHighlight>) {
    const { highlights, selectedIndex } = this.state
    const selectedHighlight = highlights && selectedIndex > -1 ? highlights[selectedIndex] : null

    const newSelectedIndex = selectedHighlight ? uploadedHighlights.findIndex((element) => element.id === selectedHighlight.id) : -1

    if (highlights) {
      this.setState({
        highlights: [...uploadedHighlights],
        changeMode: ChangeMode.AddNew,
        selectedIndex: newSelectedIndex,
        memoHighlights: [],
      })
    }

    if (newSelectedIndex > -1) {
      this.scrollViewerTo(selectedHighlight)
    }
  }

  removeTextFromReminded() {
    const { memoHighlights } = this.state

    if (memoHighlights) {
      memoHighlights.forEach((x) => {
        x.content.text = '-'
      })
    }
  }

  addHighlights(newHighlights: Array<NewHighlight>) {
    const { highlights, memoHighlights } = this.state

    if (this.debugEnabled) { console.debug('pdf-viewer:addHighlights', newHighlights) }

    const identifiedHighlights = newHighlights.map((element) => { return { ...element, id: getNextId() } })
    const addedHighlights = [...identifiedHighlights, ...memoHighlights]
    window.dispatchEvent(new CustomEvent('pdf-viewer:addHighlights', {
      detail: { highlights: addedHighlights.reverse() }
    }))

    this.setState({
      highlights: [...identifiedHighlights, ...highlights],
      changeMode: ChangeMode.ChangeExist,
      memoHighlights: [],
      lastHighlightsCount: addedHighlights.length, // For the correct cancel last highlights
    })

  }

  remindHighlights(newHighlights: Array<NewHighlight>) {
    const { highlights, memoHighlights } = this.state

    if (this.debugEnabled) { console.debug('remindHighlights', newHighlights) }

    const identifiedHighlights = newHighlights.map((element) => { return { ...element, id: getNextId() } })

    this.setState({
      highlights: [...identifiedHighlights, ...highlights],
      changeMode: ChangeMode.AddNew,
      memoHighlights: [...identifiedHighlights, ...memoHighlights],
    })

  }

  selectHighlights(selectedHighlights: Array<IHighlight>) {

    if (this.debugEnabled) { console.debug('selectHighlights', selectedHighlights) }

    const { highlights } = this.state
    const newHighlights: IHighlight[] = []

    selectedHighlights.forEach((item) => {
      const index = highlights.findIndex((element) => element.id === item.id)
      if (index === -1) {
        newHighlights.push(item)
      } else {
        highlights[index] = item
      }
    })

    if (newHighlights.length > 0) {
      this.setState({
        highlights: [...newHighlights, ...highlights],
        selectedIndex: 0,
        memoHighlights: [],
      })
    } else {
      this.setState({
        selectedIndex: highlights.findIndex((element) => element.id === selectedHighlights[0].id),
        memoHighlights: [],
      })
    }
    this.scrollViewerTo(selectedHighlights[0])
  }

  editHighlights(highlightItems: Array<IHighlight>) {

    if (this.debugEnabled) { console.debug('editHighlights', highlightItems) }

    const { highlights } = this.state
    const newHighlights: IHighlight[] = []

    highlightItems.forEach((item) => {
      const index = highlights.findIndex((element) => element.id === item.id)
      if (index === -1) {
        newHighlights.push(item)
      } else {
        highlights[index] = item
      }
    })

    if (newHighlights.length > 0) {
      this.setState({
        highlights: [...newHighlights, ...highlights],
        changeMode: ChangeMode.ChangeExist,
        memoHighlights: [],
      })
    } else {
      this.setState({
        changeMode: ChangeMode.ChangeExist,
        memoHighlights: [],
      })
    }
    this.scrollViewerTo(highlightItems[0])
  }

  removeHighlights(highlightItems: Array<IHighlight>) {

    if (this.debugEnabled) { console.debug('removeHighlights', highlightItems) }

    const { highlights, selectedIndex } = this.state
    const removedIndexes: number[] = []

    highlightItems.forEach((item) => {
      const index = highlights.findIndex((element) => element.id === item.id)
      if (index > -1) {
        highlights.splice(index, 1)
        removedIndexes.push(index)
      }
    })

    if (highlights.length > 0) {
      this.setState({
        highlights: [...highlights],
        changeMode: ChangeMode.AddNew,
        selectedIndex: removedIndexes.indexOf(selectedIndex) > -1 ? -1 : selectedIndex,
        memoHighlights: [],
      })
    } else {
      this.setState({
        changeMode: ChangeMode.AddNew,
        memoHighlights: [],
      })
    }
    // this.scrollViewerTo(highlightItems[0])
  }

  afterPersistHighlights(highlightItems: Array<IHighlight>) {

    if (this.debugEnabled) { console.debug('afterPersistHighlights', highlightItems) }

    this.setState({
      changeMode: ChangeMode.AddNew,
      memoHighlights: [],
    })
  }

  cancelLatestHighlight = () => {

    if (this.debugEnabled) { console.debug('cancelLatestHighlight') }

    const { highlights, selectedIndex, lastHighlightsCount } = this.state
    const dropCount = Math.min(lastHighlightsCount, highlights.length)
    for (let i = 0; i < dropCount; i++) {
      highlights.shift()
    }
    this.setState({
      highlights: [...highlights],
      changeMode: ChangeMode.AddNew,
      selectedIndex: selectedIndex > -1 ? selectedIndex - 1 : -1,
      memoHighlights: [],
      lastHighlightsCount: 0,
    })
  }

  cancelEditHighlights = (highlightItems: Array<IHighlight>) => {

    if (this.debugEnabled) { console.debug('cancelEditHighlights', highlightItems) }

    const { highlights } = this.state
    const newHighlights: IHighlight[] = []

    highlightItems.forEach((item) => {
      const index = highlights.findIndex((element) => element.id === item.id)
      if (index === -1) {
        newHighlights.push(item)
      } else {
        highlights[index] = item
      }
    })

    if (newHighlights.length > 0) {
      this.setState({
        highlights: [...newHighlights, ...highlights],
        changeMode: ChangeMode.AddNew,
        memoHighlights: [],
      })
    } else {
      this.setState({
        changeMode: ChangeMode.AddNew,
        memoHighlights: [],
      })
    }
    this.scrollViewerTo(highlightItems[0])
  }

  updateHighlight(highlightId: string, position: Object, content: Object) {

    const modifiedHighlight = { position: position, content: content, id: highlightId }
    if (this.debugEnabled) { console.debug('pdf-viewer:updateHighlight', modifiedHighlight) }
    window.dispatchEvent(new CustomEvent('pdf-viewer:updateHighlight', {
      detail: { highlight: modifiedHighlight }
    }))

    this.setState({
      highlights: this.state.highlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
            id,
            position: { ...originalPosition, ...position },
            content: { ...originalContent, ...content },
            ...rest,
          }
          : h
      }),
      changeMode: ChangeMode.ChangeExist,
    });
  }

  componentDidUpdate(prevProps: any, prevState: State): void {
    // console.log(prevState)
  }

  render() {
    const { url, highlights, changeMode } = this.state
    const self = this

    return (
      <div>
        <div className="App" style={{ display: "flex", height: "100vh" }}>
          <div
            style={{
              height: "100vh",
              width: "100vw",
              position: "relative",
            }}
          >
            <PdfLoader url={url} beforeLoad={<Spinner />}>
              {(pdfDocument) => (
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  enableAreaSelection={(event) => self.state?.changeMode === ChangeMode.AddNew}
                  onScrollChange={resetHash}
                  // pdfScaleValue="page-width"
                  scrollRef={(scrollTo) => {
                    this.scrollViewerTo = scrollTo

                    this.scrollToHighlightFromHash()
                  }}
                  onSelectionFinished={(
                    positions,
                    contents,
                    hideTipAndSelection,
                    transformSelection,
                    hideTipOnly,
                  ) => (<Tip
                    changeMode={changeMode}
                    textAvailable={contents.some((element) => element.text && element.text !== '-')}
                    onAddImage={
                      () => {
                        transformSelection()
                        contents.forEach((element) => {
                          element.text = '-'
                        })
                        this.removeTextFromReminded()
                        this.addHighlights(positions.map((position, i) => { return { content: contents[i], position, comment: { text: '', emoji: '' } } }))
                        hideTipAndSelection()
                      }
                    }
                    onAddImageAndText={
                      () => {
                        transformSelection()
                        this.addHighlights(positions.map((position, i) => { return { content: contents[i], position, comment: { text: '', emoji: '' } } }))
                        hideTipAndSelection()
                      }
                    }
                    onContinue={
                      () => {
                        transformSelection()
                        this.remindHighlights(positions.map((position, i) => { return { content: contents[i], position, comment: { text: '', emoji: '' } } }))
                        hideTipOnly()
                      }
                    }
                  />)}
                  highlightTransform={(
                    highlight,
                    index,
                    setTip,
                    hideTip,
                    viewportToScaled,
                    screenshot,
                    isScrolledTo
                  ) => {
                    return (
                      <Popup
                        popupContent={<HighlightPopup {...highlight} />}
                        onMouseOver={(popupContent) =>
                          setTip(highlight, (highlight) => popupContent)
                        }
                        onMouseOut={hideTip}
                        key={index}
                        children={
                          <AreaHighlight
                            locked={false}
                            highlight={highlight}
                            onChange={(boundingRect) => {
                              this.updateHighlight(
                                highlight.id,
                                { pageNumber: boundingRect.pageNumber, boundingRect: viewportToScaled(boundingRect) },
                                {
                                  text: highlight.content.text,
                                  image: screenshot(boundingRect),
                                }
                              );
                            }}
                          />
                        }
                      />
                    );
                  }}
                  highlights={highlights}
                />
              )}
            </PdfLoader>
          </div>
        </div>

      </div>
    )
  }
}

export default PDFwrapper
