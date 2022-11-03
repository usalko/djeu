import { Component } from "react";

import "../style/Tip.css";


export enum ChangeMode {
  AddNew = 1,
  ChangeExist,
};

interface State {
}

interface Props {
  onAddImage: () => void;
  onAddImageAndText: () => void;
  onContinue: () => void;
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
    const { changeMode, textAvailable, onAddImage, onAddImageAndText, onContinue } = this.props;

    return (
      <div className="Tip">
        <div
          className="Tip__compact"
          onClick={(event) => {
            event.preventDefault()
            onAddImage()
          }}
        >
          {changeMode === ChangeMode.AddNew ? 'Добавить цитату' : 'Обновить цитату'}
        </div>
        {textAvailable ? (
          <div
            className="Tip__compact_without_top_bound"
            onClick={(event) => {
              event.preventDefault()
              onAddImageAndText()
            }}
          >
            {changeMode === ChangeMode.AddNew ? 'Добавить цитату и текст' : 'Обновить цитату и текст'}
          </div>
        ) : ''}
        <div
          className="Tip__compact_without_top_bound"
          onClick={(event) => {
            event.preventDefault()
            onContinue()
          }}
        >
          {'Еще...'}
        </div>
      </div>
    );
  }
}

export default Tip;
