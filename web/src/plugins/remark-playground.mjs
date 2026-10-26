// Lets lessons write runnable examples as ordinary fenced code blocks:
//
//   <Playground>
//   ```js
//   console.log("Hello!");
//   ```
//   </Playground>
//
// The code blocks stay in place, so Expressive Code still renders them as the
// no-JavaScript fallback. This plugin copies their raw text into a `files`
// attribute that the Playground component turns into an editable, runnable example.

function walk(node, visit) {
  visit(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, visit);
  }
}

function titleFrom(meta) {
  if (!meta) return null;
  const match = /title=(?:"([^"]+)"|'([^']+)')/.exec(meta);
  return match ? match[1] ?? match[2] : null;
}

export function remarkPlayground() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'mdxJsxFlowElement' || node.name !== 'Playground') return;
      const files = [];
      walk(node, (child) => {
        if (child.type === 'code') {
          files.push({ lang: child.lang || 'js', title: titleFrom(child.meta), code: child.value });
        }
      });
      node.attributes = node.attributes.filter((attribute) => attribute.name !== 'files');
      node.attributes.push({ type: 'mdxJsxAttribute', name: 'files', value: JSON.stringify(files) });
    });
  };
}
