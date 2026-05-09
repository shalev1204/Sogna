// Fixes https://github.com/sognaflowdivision/sognaflow/issues/2270
export const getContextWindow = ({ current }) => {
    return current ? current.ownerDocument.defaultView : null;
};
//# sourceMappingURL=get-context-window.js.map
