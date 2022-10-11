import { Component } from "react";

import { asElement, isHTMLElement } from "../lib/pdfjs-dom";
import "../style/MouseSelection.css";

import type { LeftTopWidthHeight } from "../types.js";

interface Coords {
  x: number
  y: number
}

interface State {
  locked: boolean
  start: Coords | null
  end: Coords | null
}

interface Props {
  onSelection: (
    startTarget: HTMLElement,
    boundingRect: LeftTopWidthHeight,
    resetSelection: () => void,
  ) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  shouldStart: (event: MouseEvent) => boolean;
  onChange: (isVisible: boolean) => void;
}

class MouseSelection extends Component<Props, State> {
  state: State = {
    locked: false,
    start: null,
    end: null,
  };

  root?: HTMLElement;

  reset = () => {
    const { onDragEnd } = this.props;

    onDragEnd();
    this.setState({
      start: null,
      end: null,
      locked: false,
    });
  };

  getBoundingRect(start: Coords, end: Coords): LeftTopWidthHeight {
    return {
      left: Math.min(end.x, start.x),
      top: Math.min(end.y, start.y),

      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  componentDidUpdate() {
    const { onChange } = this.props;
    const { start, end } = this.state;

    const isVisible = Boolean(start && end);

    onChange(isVisible);

    // const stickyParent = this.root?.parentElement ? this.stickyParent(this.root?.parentElement): null
    // const initialStickyParentTop = stickyParent ? stickyParent.getBoundingClientRect().top : 0

    // console.debug(`Component MouseSelection did update ${initialStickyParentTop}`)
  }

  componentDidMount() {
    if (!this.root) {
      return;
    }

    const that = this;

    const { onSelection, onDragStart, onDragEnd, shouldStart } = this.props;

    const container = asElement(this.root.parentElement);
    // const stickyParent = this.stickyParent(this.root.parentElement)
    // const initialStickyParentOffsetTop = stickyParent ? stickyParent.offsetTop : 0

    if (!isHTMLElement(container)) {
      return;
    }

    // let containerBoundingRect: DOMRect | null = null;

    const containerCoords = (pageX: number, pageY: number) => {
      // if (!containerBoundingRect) {
      //   containerBoundingRect = container.getBoundingClientRect();
      // }
      const containerBoundingRect = container.getBoundingClientRect();

      // const stickyParentOffsetTop = stickyParent ? stickyParent.offsetTop : 0
      // const stickyParentY = stickyParent ? stickyParent.getBoundingClientRect().y : 0
      // const stickyParentParentY = stickyParent && stickyParent.parentElement ? stickyParent.parentElement.getBoundingClientRect().y : 0
      // const stickyEffect = initialStickyParentOffsetTop < stickyParentOffsetTop // (!stickyParent ? 0 : initialStickyParentTop - stickyParent.getBoundingClientRect().top)
      // console.debug(`Parent container coords is ${JSON.stringify(container.getBoundingClientRect())} initial:\n${JSON.stringify(containerBoundingRect)}\nstickyEffect is ${stickyEffect}, container.scrollTop is ${container.scrollTop}, window.scrollY is ${window.scrollY}, stickyParentY is ${stickyParentY}, stickyParentParentY is ${stickyParentParentY}, stickyParentTop is ${JSON.stringify(stickyParentOffsetTop)}`)

      return {
        x: pageX - containerBoundingRect.left + container.scrollLeft,
        y:
          pageY
          - containerBoundingRect.top
          + container.scrollTop
          // + stickyDelta
          // + (stickyEffect ?  (stickyParentY + (initialStickyParentOffsetTop - stickyParentY) / 2) : 0)
          - window.scrollY
        ,
      };
    };

    container.addEventListener("mousemove", (event: MouseEvent) => {
      const { start, locked } = this.state;

      if (!start || locked) {
        return;
      }

      that.setState({
        ...this.state,
        end: containerCoords(event.pageX, event.pageY),
      });
    });

    container.addEventListener("mousedown", (event: MouseEvent) => {
      if (!shouldStart(event)) {
        this.reset();
        return;
      }

      const startTarget = asElement(event.target);
      if (!isHTMLElement(startTarget)) {
        return;
      }

      onDragStart();

      this.setState({
        start: containerCoords(event.pageX, event.pageY),
        end: null,
        locked: false,
      });

      const onMouseUp = (event: MouseEvent): void => {
        // emulate listen once
        event.currentTarget?.removeEventListener(
          "mouseup",
          onMouseUp as EventListener
        );

        const { start } = this.state;

        if (!start) {
          return;
        }

        const end = containerCoords(event.pageX, event.pageY);

        const boundingRect = that.getBoundingRect(start, end);

        if (
          !isHTMLElement(event.target) ||
          !container.contains(asElement(event.target)) ||
          !that.shouldRender(boundingRect)
        ) {
          that.reset();
          return;
        }

        that.setState(
          {
            end,
            locked: true,
          },
          () => {
            // Callback
            const { start, end } = that.state;

            if (!start || !end) {
              return
            }

            if (isHTMLElement(event.target)) {
              onSelection(startTarget, boundingRect, that.reset)
              onDragEnd()
            }

          }
        );
      };

      const { ownerDocument: doc } = container;
      if (doc.body) {
        doc.body.addEventListener("mouseup", onMouseUp);
      }
    });

    // console.debug(`Component MouseSelection did mount ${initialStickyParentTop}`)
  }

  // _trace() {
  //   console.debug(`MouseSelection state: ${JSON.stringify(this.state)}`)
  // }

  stickyParent(parentElement: HTMLElement | null): HTMLElement | null {
    if (!parentElement) {
      return null
    }
    // FIXME: Hardcore class name (try to use css class definition and position)
    if (parentElement.style.position === 'sticky' || parentElement.className === 'publicationCreateForm') {
      return parentElement
    }
    return this.stickyParent(parentElement.parentElement)
  }

  shouldRender(boundingRect: LeftTopWidthHeight) {
    return boundingRect.width >= 1 && boundingRect.height >= 1;
  }

  render() {
    const { start, end } = this.state;

    return (
      <div
        className="MouseSelection-container"
        ref={(node) => {
          if (!node) {
            return;
          }
          this.root = node;
        }}
      >
        {start && end ? (
          <div
            className="MouseSelection"
            style={this.getBoundingRect(start, end)}
          />
        ) : null}
      </div>
    );
  }
}

export default MouseSelection;
