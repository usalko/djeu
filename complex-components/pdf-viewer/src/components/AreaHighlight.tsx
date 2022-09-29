import { Component } from "react";

import { Rnd } from "react-rnd";
import { getPageFromElement } from "../lib/pdfjs-dom";

import "../style/AreaHighlight.css";

import type { LeftTopWidthHeightPageNumber, ViewportHighlight } from "../types";

interface Props {
  highlight: ViewportHighlight;
  onChange: (rect: LeftTopWidthHeightPageNumber) => void;
  locked: boolean;
}

export class AreaHighlight extends Component<Props> {
  render() {
    const { highlight, onChange, locked, ...otherProps } = this.props;

    return (
      <div
        className={`AreaHighlight ${
          locked ? "AreaHighlight--locked" : ""
        }`}
      >
        <Rnd
          className="AreaHighlight__part"
          onDragStop={(_, data) => {
            const boundingRect: LeftTopWidthHeightPageNumber = {
              ...highlight.position.boundingRect,
              top: data.y,
              left: data.x,
            };

            onChange(boundingRect);
          }}
          onResizeStop={(_mouseEvent, _direction, ref, _delta, position) => {
            const boundingRect: LeftTopWidthHeightPageNumber = {
              top: position.y,
              left: position.x,
              width: ref.offsetWidth,
              height: ref.offsetHeight,
              pageNumber: getPageFromElement(ref)?.number || -1,
            };

            onChange(boundingRect);
          }}
          position={{
            x: highlight.position.boundingRect.left,
            y: highlight.position.boundingRect.top,
          }}
          size={{
            width: highlight.position.boundingRect.width,
            height: highlight.position.boundingRect.height,
          }}
          onClick={(event: Event) => {
            event.stopPropagation();
            event.preventDefault();
          }}
          {...otherProps}
        />
      </div>
    );
  }
}

export default AreaHighlight;
