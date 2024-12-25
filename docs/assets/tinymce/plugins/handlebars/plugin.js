/**
 * mce-handlebars.js 1.0.0 (2024-12-11)
 */

function escape(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  function getFragments(text, prefix, suffix) {
    const escapedPrefix = escape(prefix);
    const escapedSuffix = escape(suffix);
    const regex = new RegExp(`${escapedPrefix}(.*?)${escapedSuffix}`, 'g');
    const fragments = [];
  
    let match;
    while ((match = regex.exec(text)) !== null) {
      fragments.push({
        type: 'token',
        value: match[1],
        start: match.index,
        length: match[0].length,
        end: match.index + match[0].length
      });
    }
  
    const snippets = [];
  
    for (let i = 0; i < fragments.length; i++) {
      const f = fragments[i];
  
      if (f.type != 'token') {
        continue;
      }
  
      if (i === 0 && f.start > 0) {
        snippets.push({
          type: 'text',
          value: text.slice(0, f.start),
          start: 0,
          end: f.start
        });
      }
  
      if (i > 0) {
        const prevFragment = fragments[i - 1];
        if (prevFragment.end < f.start) {
          snippets.push({
            type: 'text',
            value: text.slice(prevFragment.end, f.start),
            start: prevFragment.end,
            end: f.start
          });
        }
      }
  
      if (i === fragments.length - 1 && f.end < text.length) {
        snippets.push({
          type: 'text',
          value: text.slice(f.end),
          start: f.end,
          end: text.length
        });
      }
    }
  
    snippets.forEach(snippet => fragments.push(snippet));
  
    fragments.sort((a, b) => a.start - b.start);
  
    return fragments;
  }
  
  function buildTokenNode(value, prefix, suffix) {
    const wrapperNode = tinymce.html.Node.create("span", {
      contentEditable: "false",
      "data-handlebars-wrapper": "1"
    });
  
    const leftEdge = tinymce.html.Node.create("span", {
      class: "handlebars-data-affix",
      "data-handlebars-pre-affix": prefix
    });
    const a = tinymce.html.Node.create("#text");
    a.value = prefix;
    leftEdge.append(a);
    wrapperNode.append(leftEdge);
  
  
    const label = tinymce.html.Node.create("#text");
    label.value = value;
    wrapperNode.append(label);
  
    const rightEdge = tinymce.html.Node.create("span", {
      class: "handlebars-data-affix",
      "data-handlebars-post-affix": suffix
    });
    const b = tinymce.html.Node.create("#text");
    b.value = suffix;
    rightEdge.append(b);
    wrapperNode.append(rightEdge);
    return wrapperNode;
  }
  
  function buildNode(fragments, config) {
    const container = tinymce.html.Node.create("span");
  
    fragments.forEach(fragment => {
      if (fragment.type == 'token') {
        const node = buildTokenNode(fragment.value, config.prefix, config.suffix);
        container.append(node);
      } else {
        const node = tinymce.html.Node.create("#text");
        node.value = fragment.value;
        container.append(node);
      }
    })
  
    return container;
  }
  
  tinymce.PluginManager.add('handlebars', function (editor, url) {
  
    var config = editor.getParam('handlebars');
  
    editor.on('PreInit', function () {
      editor.parser.addNodeFilter("#text", (nodes, name) => {
        nodes.forEach(n => {
          const fragments = getFragments(n.value, config.prefix, config.suffix);
          if (fragments.length === 0) {
            return;
          }
  
          const newNode = buildNode(fragments, config);
          n.replace(newNode);
          newNode.unwrap(); // Delete the temporary wrapping container
        });
      })
    });
  
    editor.on('PreInit', function () {
      editor.serializer.addAttributeFilter('data-handlebars-wrapper', (nodes, name) => {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.children().forEach(i => {
            if (i.name != '#text') {
              i.unwrap();
            }
          })
          n.unwrap();
        }
      });
  
    });
  
    const menuItems = [];
  
    config.items.forEach(i => {
      menuItems.push({
        type: 'menuitem',
        text: i.text,
        value: i.value,
        onAction: () => {
          editor.insertContent([
            `<span data-handlebars-wrapper="1" contenteditable="false">`,
            `<span class="handlebars-data-affix" data-handlebars-pre-affix="${config.prefix}">${config.prefix}</span>`,
            i.value,
            `<span class="handlebars-data-affix" data-handlebars-post-affix="${config.prefix}">${config.suffix}</span>`,
            `</span>`
          ].join(''))
        }
      });
    });
  
    editor.ui.registry.addMenuButton('handlebars', {
      icon: 'addtag',
      text: 'Tags',
      fetch: (callback) => {
        callback(menuItems);
      }
    });
  
    return {
      getMetadata: function () {
        return {
          name: 'Handlebars',
          url: 'https://github.com/curiousdev/mce-handlebars'
        };
      }
    };
  });