import { Component } from "react";

import "../style/Tip.css";


export enum ChangeMode {
  AddNew = 1,
  ChangeExist,
};

interface State {
}

interface Props {
  onAction: (withText: boolean) => void;
  changeMode: ChangeMode,
  textAvailable: boolean,
}

export class Tip extends Component<Props, State> {
  
  state: State = {
  };

  // for TipContainer
  componentDidUpdate(nextProps: Props, nextState: State) {
    // const { onUpdate } = this.props;

    // if (onUpdate) {
    //   onUpdate();
    // }
  }

  render() {
    const { changeMode, textAvailable, onAction } = this.props;

    return (
      <div className="Tip">
        <div
          className="Tip__compact"
          onClick={(event) => {
            event.preventDefault();
            onAction(false);
            // this.setState({ compact: false });
            // onConfirm({ text, emoji });
          }}
        >
          {changeMode === ChangeMode.AddNew ? 'Добавить цитату' : 'Обновить цитату'}
        </div>
        {textAvailable ? (
          <div
            className="Tip__compact_without_top_bound"
            onClick={(event) => {
              event.preventDefault();
              onAction(true);
              // this.setState({ compact: false });
              // onConfirm({ text, emoji });
            }}
          >
            {changeMode === ChangeMode.AddNew ? 'Добавить цитату и текст' : 'Обновить цитату и текст'}
          </div>
        ) : ''}
        {
          /* {compact ? (
            <div
              className="Tip__compact"
              onClick={() => {
                onOpen();
                this.setState({ compact: false });
              }}
            >
              Add highlight
            </div>
          ) : (
            <form
              className="Tip__card"
              onSubmit={(event) => {
                event.preventDefault();
                onConfirm({ text, emoji });
              }}
            >
              <div>
                <textarea
                  placeholder="Your comment"
                  autoFocus
                  value={text}
                  onChange={(event) =>
                    this.setState({ text: event.target.value })
                  }
                  ref={(node) => {
                    if (node) {
                      node.focus();
                    }
                  }}
                />
                <div>
                  {["💩", "😱", "😍", "🔥", "😳", "⚠️"].map((_emoji) => (
                    <label key={_emoji}>
                      <input
                        checked={emoji === _emoji}
                        type="radio"
                        name="emoji"
                        value={_emoji}
                        onChange={(event) =>
                          this.setState({ emoji: event.target.value })
                        }
                      />
                      {_emoji}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <input type="submit" value="Save" />
              </div>
            </form>
          )} */
        }
      </div>
    );
  }
}

export default Tip;
