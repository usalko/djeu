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
  cancelLatestHighlightListener: any
  selectHighlightsListener: any
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
      selectedIndex: -1,
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
    if (!this.setHighlightsListener) {
      this.setHighlightsListener = window.addEventListener('jquery-pdf-viewer:setHighlights',
        (e: Event) => {
          console.debug(e)
          if ((e as CustomEvent).detail?.highlights) {
            this.setHighlights(JSON.parse((e as CustomEvent).detail.highlights))
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
    if (!this.selectHighlightsListener) {
      this.selectHighlightsListener = window.addEventListener('pdf-viewer-integration:selectHighlights',
        (e: Event) => {
          console.debug(e)
          if ('detail' in e && (e as CustomEvent).detail?.highlights) {
            this.selectHighlights(JSON.parse((e as CustomEvent).detail.highlights))
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
        selectedIndex: newSelectedIndex
      })
    }

    if (newSelectedIndex > -1) {
      this.scrollViewerTo(selectedHighlight)
    }
  }

  addHighlights(newHighlights: Array<NewHighlight>) {
    const { highlights } = this.state

    // console.log("Saving highlight", highlight)

    const identifiedHighlights = newHighlights.map((element) => { return { ...element, id: getNextId() }})
    window.dispatchEvent(new CustomEvent('pdf-viewer:addHighlights', {
      detail: { highlights: identifiedHighlights }
    }))

    this.setState({
      highlights: [...identifiedHighlights, ...highlights],
      changeMode: ChangeMode.ChangeExist,
    })

  }

  selectHighlights(selectedHighlights: Array<IHighlight>) {
    const { highlights } = this.state
    const index = highlights.findIndex((element) => element.id === selectedHighlights[0].id)

    if (index === -1) {
      this.setState({
        highlights: [...selectedHighlights, ...highlights],
        selectedIndex: 0,
      })
    } else {
      highlights[index] = selectedHighlights[0]
      this.setState({
        highlights: [...selectedHighlights, ...highlights],
        selectedIndex: index,
      })
    }
    this.scrollViewerTo(selectedHighlights)
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
    const { highlights, selectedIndex } = this.state
    const index = highlights.findIndex((element) => element.id === highlight.id)

    if (index > -1) {
      highlights.splice(index, 1)
      this.setState({
        highlights: [...highlights],
        changeMode: ChangeMode.AddNew,
        selectedIndex: selectedIndex === index ? -1 : selectedIndex
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
      this.setState({
        changeMode: ChangeMode.AddNew,
      })
    } else {
      this.setState({
        highlights: [highlight, ...highlights],
        changeMode: ChangeMode.AddNew,
      })
    }
    this.scrollViewerTo(highlight)
  }

  cancelLatestHighlight = () => {
    const { highlights, selectedIndex } = this.state
    highlights.pop()
    this.setState({
      highlights: [...highlights],
      changeMode: ChangeMode.AddNew,
      selectedIndex: selectedIndex > -1 ? selectedIndex - 1 : -1
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
                  ) => (<Tip
                    changeMode={changeMode}
                    textAvailable={contents.some((element) => element.text && element.text !== '-')}
                    onAction={(withText) => {
                      transformSelection()
                      if (!withText) {
                        contents.forEach((element) => {
                          element.text = '-'
                        })
                      }
                      this.addHighlights(positions.map((position, i) => { return { content: contents[i], position, comment: { text: '', emoji: '' } }}))
                      hideTipAndSelection()
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
