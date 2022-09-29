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
  changeMode: ChangeMode
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
  cancelLatestHighlightListener: any
  selectHighlightListener: any
  editHighlightListener: any
  removeHighlightListener: any
  afterPersistHighlightListener: any
  cancelEditHighlightListener: any

  constructor(props: any) {
    super(props)
    this.state = {
      url: props.url,
      highlights: props.highlights || [],
      changeMode: ChangeMode.AddNew,
    }
  }

  resetHighlights = () => {
    this.setState({
      highlights: [],
      changeMode: ChangeMode.AddNew,
    })
  }

  toggleDocument = (newUrl: string) => {
    this.setState({
      url: newUrl,
      highlights: [],
      changeMode: ChangeMode.AddNew,
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
            console.debug(e)
            if (e?.detail?.url) {
              this.toggleDocument(e?.detail?.url)
            }
          }
        },
        false
      )
    }
    if (!this.cancelLatestHighlightListener) {
      this.cancelLatestHighlightListener = window.addEventListener('pdf-viewer-integration:cancelLatestHighlight',
        (e: Event) => {
          console.debug(e)
          this.cancelLatestHighlight()
        },
        false
      )
    }
    if (!this.selectHighlightListener) {
      this.selectHighlightListener = window.addEventListener('pdf-viewer-integration:selectHighlight',
        (e: Event) => {
          console.debug(e)
          if ('detail' in e && (e as CustomEvent).detail?.highlight) {
            this.selectHighlight(JSON.parse((e as CustomEvent).detail.highlight))
          }
        },
        false
      )
    }
    if (!this.editHighlightListener) {
      this.editHighlightListener = window.addEventListener('pdf-viewer-integration:editHighlight',
        (e: Event) => {
          console.debug(e)
          if ('detail' in e && (e as CustomEvent).detail?.highlight) {
            this.editHighlight(JSON.parse((e as CustomEvent).detail.highlight))
          }
        },
        false
      )
    }
    if (!this.removeHighlightListener) {
      this.removeHighlightListener = window.addEventListener('pdf-viewer-integration:removeHighlight',
        (e: Event) => {
          console.debug(e)
          if ('detail' in e && (e as CustomEvent).detail?.highlight) {
            this.removeHighlight(JSON.parse((e as CustomEvent).detail.highlight))
          }
        },
        false
      )
    }
    if (!this.afterPersistHighlightListener) {
      this.afterPersistHighlightListener = window.addEventListener('pdf-viewer-integration:afterPersistHighlight',
        (e: Event) => {
          console.debug(e)
          if ('detail' in e && (e as CustomEvent).detail?.highlight) {
            this.afterPersistHighlight(JSON.parse((e as CustomEvent).detail.highlight))
          }
        },
        false
      )
    }
    if (!this.cancelEditHighlightListener) {
      this.cancelEditHighlightListener = window.addEventListener('pdf-viewer-integration:cancelEditHighlight',
        (e: Event) => {
          console.debug(e)
          if ('detail' in e && (e as CustomEvent).detail?.highlight) {
            this.cancelEditHighlight(JSON.parse((e as CustomEvent).detail.highlight))
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
    return 'id' in object;
  }

  addHighlight(highlight: NewHighlight) {
    const { highlights } = this.state

    // console.log("Saving highlight", highlight)

    const identifiedHighlight = { ...highlight, id: getNextId() }
    window.dispatchEvent(new CustomEvent('pdf-viewer:addHighlight', {
      detail: { highlight: identifiedHighlight }
    }))

    this.setState({
      highlights: [identifiedHighlight, ...highlights],
      changeMode: ChangeMode.ChangeExist,
    })

  }

  selectHighlight(highlight: IHighlight) {
    const { highlights } = this.state
    const index = highlights.findIndex((element) => element.id === highlight.id)

    if (index === -1) {
      this.setState({
        highlights: [highlight, ...highlights],
      })
    } else {
      highlights[index] = highlight
    }
    this.scrollViewerTo(highlight)
  }

  editHighlight(highlight: IHighlight) {
    const { highlights } = this.state
    const index = highlights.findIndex((element) => element.id === highlight.id)

    if (index === -1) {
      this.setState({
        highlights: [highlight, ...highlights],
        changeMode: ChangeMode.ChangeExist,
      })
    } else {
      highlights[index] = highlight
      this.setState({
        changeMode: ChangeMode.ChangeExist,
      })
    }
    this.scrollViewerTo(highlight)
  }

  removeHighlight(highlight: IHighlight) {
    const { highlights } = this.state
    const index = highlights.findIndex((element) => element.id === highlight.id)

    if (index > -1) {
      highlights.splice(index, 1)
      this.setState({
        highlights: [...highlights],
        changeMode: ChangeMode.AddNew,
      })
    } else {
      this.setState({
        changeMode: ChangeMode.AddNew,
      })
    }
    this.scrollViewerTo(highlight)
  }

  afterPersistHighlight(highlight: IHighlight) {
    const { highlights } = this.state
    const index = highlights.findIndex((element) => element.id === highlight.id)

    if (index > -1) {
      highlights.splice(index, 1)
      this.setState({
        highlights: [...highlights],
        changeMode: ChangeMode.AddNew,
      })
    } else {
      this.setState({
        changeMode: ChangeMode.AddNew,
      })
    }
    this.scrollViewerTo(highlight)
  }

  cancelLatestHighlight = () => {
    const highlights = this.state.highlights
    highlights.pop()
    this.setState({
      highlights: [...highlights],
      changeMode: ChangeMode.AddNew,
    })
  }

  cancelEditHighlight = (highlight: IHighlight) => {
    const { highlights } = this.state
    const index = highlights.findIndex((element) => element.id === highlight.id)

    if (index === -1) {
      this.setState({
        highlights: [highlight, ...highlights],
        changeMode: ChangeMode.AddNew,
      })
    } else {
      highlights[index] = highlight
      this.setState({
        changeMode: ChangeMode.AddNew,
      })
    }
    this.scrollViewerTo(highlight)
  }

  updateHighlight(highlightId: string, position: Object, content: Object) {

    // console.debug("Updating highlight", highlightId, position, content)

    const modifiedHighlight = { position: position, content: content, id: highlightId }
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
                  enableAreaSelection={(event) => changeMode === ChangeMode.AddNew}
                  onScrollChange={resetHash}
                  // pdfScaleValue="page-width"
                  scrollRef={(scrollTo) => {
                    this.scrollViewerTo = scrollTo;

                    this.scrollToHighlightFromHash();
                  }}
                  onSelectionFinished={(
                    position,
                    content,
                    hideTipAndSelection,
                    transformSelection,
                  ) => (<Tip
                    changeMode={changeMode}
                    textAvailable={content.text && content.text !== '-' ? true : false}
                    onAction={(withText) => {
                      transformSelection();
                      if (!withText) {
                        content.text = '-'
                      }
                      this.addHighlight({ content, position, comment: { text: '', emoji: '' } });
                      hideTipAndSelection();
                    }}
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
