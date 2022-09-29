import { Page } from "../types";

export const getDocument = (elm: any): Document =>
  (elm || {}).ownerDocument || document;
export const getWindow = (elm: any): typeof window =>
  (getDocument(elm) || {}).defaultView || window;
export const isHTMLElement = (elm: any) =>
  elm instanceof HTMLElement || elm instanceof getWindow(elm).HTMLElement;
export const isHTMLCanvasElement = (elm: any) =>
  elm instanceof HTMLCanvasElement ||
  elm instanceof getWindow(elm).HTMLCanvasElement;

export const asElement = (x: any): HTMLElement => x;

export const getPageFromElement = (target: HTMLElement): Page | null => {
  const node = asElement(target.closest(".page"));

  if (!node || !isHTMLElement(node)) {
    return null;
  }

  const number = Number(asElement(node).dataset.pageNumber);

  return { node, number } as Page;
};

export const getPagesFromRange = (range: Range): Page[] => {
  const startParentElement = range.startContainer.parentElement;
  const endParentElement = range.endContainer.parentElement;

  if (!isHTMLElement(startParentElement) || !isHTMLElement(endParentElement)) {
    return [] as Page[];
  }

  const startPage = getPageFromElement(asElement(startParentElement));
  const endPage = getPageFromElement(asElement(endParentElement));

  if (!startPage?.number || !endPage?.number) {
    return [] as Page[];
  }

  if (startPage.number === endPage.number) {
    return [startPage] as Page[];
  }

  if (startPage.number === endPage.number - 1) {
    return [startPage, endPage] as Page[];
  }

  const pages: Page[] = [];

  let currentPageNumber = startPage.number;

  const document = startPage.node.ownerDocument;

  while (currentPageNumber <= endPage.number) {
    const currentPage = getPageFromElement(
      document.querySelector(
        `[data-page-number='${currentPageNumber}'`
      ) as HTMLElement
    );
    if (currentPage) {
      pages.push(currentPage);
    }
  }

  return pages as Page[];
};

export const findOrCreateContainerLayer = (
  pageViewDiv: HTMLElement,
  className: string
) => {
  const doc = getDocument(pageViewDiv)
  let layer: HTMLElement | null = pageViewDiv.querySelector(`.${className}`)

  if (!layer) {
    layer = doc.createElement("div");
    layer.className = className;
    pageViewDiv.appendChild(layer);
  }

  // const canvasWrapper: HTMLElement | null = pageViewDiv.querySelector('.canvasWrapper')
  // const canvasWrapperBoundingClientRect = canvasWrapper?.getBoundingClientRect()
  // layer.style.top = canvasWrapperBoundingClientRect?.top + 'px' || ''
  // layer.style.left = canvasWrapperBoundingClientRect?.left +'px' || ''

  layer.style.width = pageViewDiv.style.width
  layer.style.height = pageViewDiv.style.height

  return layer;
};
