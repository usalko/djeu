import { ChangeEvent, Component } from "react";

import type {
  IHighlight
} from "../types";



interface Props {
  initialSearchTextInput: string
  highlights: Array<IHighlight>
  // resetHighlights: () => void
  onFind: (text: string) => void
}

interface State {
  searchTextInput: string
}

const updateHash = (highlight: IHighlight) => {
  document.location.hash = `highlight-${highlight.id}`
};

export class Toolbar extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      searchTextInput: props.initialSearchTextInput,
    }
  }

  findTextInPdfDocument(event: ChangeEvent<HTMLInputElement>) {
    const textForFind = (event.nativeEvent as InputEvent).data
    event.target.value = textForFind ? textForFind : ''
    if (textForFind) {
      this.props.onFind(textForFind)
    }
  }

  render() {
    const { highlights } = this.props;
    return (
      <div className="toolbar" >
        <div className="description" style={{ padding: "1rem" }}>
          <p>
            <small>
              Чтобы отметить область как рисунок, нажмите "Alt" и выделяйте.
            </small>
          </p>
        </div>
        <div className="search" >
          <input placeholder="Искать текст" onChange={(event) => {
            this.findTextInPdfDocument(event);
          }} value={this.state.searchTextInput} />
        </div>

      </div>
    );
  }
}

export default Toolbar;
