import { Component } from "react";
import { IHighlight, NewHighlight } from "../types/data";
import { AreaHighlight } from './AreaHighlight';
import { Highlight } from './Highlight';
import { PdfHighlighter } from './PdfHighlighter';
import { PdfLoader } from './PdfLoader';
import { Popup } from './Popup';
import { Spinner } from "./Spinner";
import { testHighlights as _testHighlights } from "./test-highlights";
import { Tip } from './Tip';

const testHighlights: Record<string, Array<IHighlight>> = _testHighlights;

export interface State {
  url: string;
  highlights: Array<IHighlight>;
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
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

// const PRIMARY_PDF_URL = "files/vedomosti_spb_1727.pdf";
// const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480.pdf";
// const initialUrl = SECONDARY_PDF_URL;
// console.log(initialUrl);

class PDFwrapper extends Component<{}, State> {

  // FIXME: Add listenersnot for window level but element level only
  listener: any

  constructor(props: any) {
    super(props)
    this.state = {
      url: props.url,
      highlights: props.highlights || [],
    }
  }

  resetHighlights = () => {
    this.setState({
      highlights: [],
    })
  }

  toggleDocument = (newUrl: string) => {
    this.setState({
      url: newUrl,
      highlights: testHighlights[newUrl] ? [...testHighlights[newUrl]] : [],
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
    // FIXME: Add listenersnot for window level but element level only
    window.addEventListener(
      "hashchange",
      this.scrollToHighlightFromHash,
      false
    )

    // FIXME: Add listenersnot for window level but element level only
    if (!this.listener) {
      this.listener = window.addEventListener('jquery-pdf-viewer:setPDFwrapperUrl',
        (e: Event) => {
          if (e instanceof CustomEvent) {
            console.log(e)
            if (e?.detail?.url) {
              this.toggleDocument(e?.detail?.url)
            }
          }
        })
    }

  }

  getHighlightById(id: string) {
    const { highlights } = this.state;

    return highlights.find((highlight) => highlight.id === id)
  }

  addHighlight(highlight: NewHighlight) {
    const { highlights } = this.state

    // console.log("Saving highlight", highlight)

    window.dispatchEvent(new CustomEvent('pdf-viewer:addHighlight', {
      detail: { highlight: highlight }
    }))

    this.setState({
      highlights: [{ ...highlight, id: getNextId() }, ...highlights],
    })
  }

  updateHighlight(highlightId: string, position: Object, content: Object) {
    console.log("Updating highlight", highlightId, position, content)

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
    });
  }

  componentDidUpdate(prevProps: any, prevState: State): void {
    // console.log(prevState)
  }

  render() {
    const { url, highlights } = this.state

    return (
      <div className="App" style={{ display: "flex", height: "100vh" }}>
        {/* <Sidebar
          highlights={highlights}
          resetHighlights={this.resetHighlights}
        /> */}
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
                enableAreaSelection={(event) => event.altKey}
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
                  transformSelection
                ) => (
                  <Tip
                    onOpen={transformSelection}
                    onConfirm={(comment) => {
                      this.addHighlight({ content, position, comment });

                      hideTipAndSelection();
                    }}
                  />
                )}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  viewportToScaled,
                  screenshot,
                  isScrolledTo
                ) => {
                  const isTextHighlight = !Boolean(
                    highlight.content && highlight.content.image
                  );

                  const component = isTextHighlight ? (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  ) : (
                    <AreaHighlight
                      isScrolledTo={isScrolledTo}
                      highlight={highlight}
                      onChange={(boundingRect) => {
                        this.updateHighlight(
                          highlight.id,
                          { boundingRect: viewportToScaled(boundingRect) },
                          { image: screenshot(boundingRect) }
                        );
                      }}
                    />
                  );

                  return (
                    <Popup
                      popupContent={<HighlightPopup {...highlight} />}
                      onMouseOver={(popupContent) =>
                        setTip(highlight, (highlight) => popupContent)
                      }
                      onMouseOut={hideTip}
                      key={index}
                      children={component}
                    />
                  );
                }}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
      </div>
    )
  }
}

export default PDFwrapper
