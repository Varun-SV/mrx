/* @ds-bundle: {"format":3,"namespace":"MrxDesignSystem_1d8204","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"KeyHint","sourcePath":"components/core/KeyHint.jsx"},{"name":"RoleTag","sourcePath":"components/core/RoleTag.jsx"},{"name":"Spinner","sourcePath":"components/core/Spinner.jsx"},{"name":"CodeBlock","sourcePath":"components/terminal/CodeBlock.jsx"},{"name":"MessageBubble","sourcePath":"components/terminal/MessageBubble.jsx"},{"name":"Prompt","sourcePath":"components/terminal/Prompt.jsx"},{"name":"StatusBar","sourcePath":"components/terminal/StatusBar.jsx"},{"name":"TerminalWindow","sourcePath":"components/terminal/TerminalWindow.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"ae3923400d70","components/core/Button.jsx":"a2c1139d513c","components/core/Card.jsx":"18310f3f9d77","components/core/KeyHint.jsx":"e0857aa1f246","components/core/RoleTag.jsx":"993091ac9ba8","components/core/Spinner.jsx":"0a6373cff0bf","components/terminal/CodeBlock.jsx":"b5d68d6f2389","components/terminal/MessageBubble.jsx":"9844f92146c7","components/terminal/Prompt.jsx":"d316296f192c","components/terminal/StatusBar.jsx":"21e69e4379d2","components/terminal/TerminalWindow.jsx":"10e4db4edf14","ui_kits/cli/chat.jsx":"451a4cfdef83","ui_kits/marketing/marketing.jsx":"4a9340a4ff1c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MrxDesignSystem_1d8204 = window.MrxDesignSystem_1d8204 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    color: 'var(--text-muted)',
    border: 'var(--border-strong)',
    bg: 'var(--bg-raised)'
  },
  brand: {
    color: 'var(--brand)',
    border: 'var(--role-reasoner-dim)',
    bg: 'var(--brand-bg)'
  },
  success: {
    color: 'var(--status-success)',
    border: 'var(--role-executor-dim)',
    bg: 'var(--role-executor-bg)'
  },
  warn: {
    color: 'var(--status-warn)',
    border: 'var(--role-tool-dim)',
    bg: 'var(--role-tool-bg)'
  },
  error: {
    color: 'var(--status-error)',
    border: 'var(--status-error)',
    bg: 'var(--status-error-bg)'
  }
};

/**
 * Badge — a small status/metadata pill. Used for versions, modes, counts, states.
 */
function Badge({
  children,
  tone = 'neutral',
  dot = false,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '2px 8px',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 'var(--weight-medium)',
      letterSpacing: 'var(--tracking-wide)',
      lineHeight: 1.5,
      color: t.color,
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: 'var(--radius-sm)',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      width: 6,
      height: 6,
      borderRadius: 'var(--radius-pill)',
      background: t.color,
      flex: 'none'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — mrx's primary action control. Monospace, boxy, terminal-native.
 * Variants: primary (brand cyan), secondary (bordered), ghost (bare), danger.
 */
function Button({
  children,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  prefix,
  full = false,
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '5px 10px',
      fontSize: 'var(--text-2xs)',
      gap: 6
    },
    md: {
      padding: '8px 14px',
      fontSize: 'var(--text-xs)',
      gap: 8
    },
    lg: {
      padding: '11px 20px',
      fontSize: 'var(--text-sm)',
      gap: 8
    }
  };
  const variants = {
    primary: {
      background: 'var(--brand)',
      color: '#06222A',
      border: '1px solid var(--brand)',
      fontWeight: 'var(--weight-semibold)'
    },
    secondary: {
      background: 'var(--bg-raised)',
      color: 'var(--text-bright)',
      border: '1px solid var(--border-strong)',
      fontWeight: 'var(--weight-medium)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
      border: '1px solid transparent',
      fontWeight: 'var(--weight-medium)'
    },
    danger: {
      background: 'transparent',
      color: 'var(--status-error)',
      border: '1px solid var(--status-error)',
      fontWeight: 'var(--weight-medium)'
    }
  };
  const v = variants[variant] || variants.secondary;
  const s = sizes[size] || sizes.md;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: onClick,
    style: {
      display: full ? 'flex' : 'inline-flex',
      width: full ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      padding: s.padding,
      fontSize: s.fontSize,
      fontFamily: 'var(--font-ui)',
      fontWeight: v.fontWeight,
      letterSpacing: 'var(--tracking-wide)',
      lineHeight: 1,
      color: v.color,
      background: v.background,
      border: v.border,
      borderRadius: 'var(--radius-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
      whiteSpace: 'nowrap',
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'translateY(1px)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'translateY(0)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'translateY(0)';
    }
  }, rest), prefix && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      opacity: 0.7
    }
  }, prefix), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — a bordered surface region. Depth via border + surface step, not shadow.
 * Optional bracketed title bar and a role/brand accent edge.
 */
function Card({
  children,
  title,
  accent,
  padded = true,
  style,
  ...rest
}) {
  const accentColor = accent ? {
    reasoner: 'var(--role-reasoner)',
    executor: 'var(--role-executor)',
    tool_caller: 'var(--role-tool)',
    user: 'var(--role-user)',
    brand: 'var(--brand)'
  }[accent] : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderTop: accentColor ? `2px solid ${accentColor}` : '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      ...style
    }
  }, rest), title && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      borderBottom: '1px solid var(--border-hair)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-wide)',
      color: 'var(--text-muted)',
      background: 'var(--bg-panel)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: padded ? 'var(--space-5)' : 0
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/KeyHint.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * KeyHint — a keyboard key rendered as a bracketed mono chip, e.g. [Ctrl+M].
 * Matches the TUI footer: "[Enter] send  [Ctrl+M] mode  ...".
 */
function KeyHint({
  keys,
  label,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-faint)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xs)',
      padding: '1px 6px',
      background: 'var(--bg-canvas)',
      letterSpacing: 'var(--tracking-wide)'
    }
  }, keys), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { KeyHint });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/KeyHint.jsx", error: String((e && e.message) || e) }); }

// components/core/RoleTag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ROLES = {
  reasoner: {
    color: 'var(--role-reasoner)',
    dim: 'var(--role-reasoner-dim)',
    bg: 'var(--role-reasoner-bg)'
  },
  executor: {
    color: 'var(--role-executor)',
    dim: 'var(--role-executor-dim)',
    bg: 'var(--role-executor-bg)'
  },
  tool_caller: {
    color: 'var(--role-tool)',
    dim: 'var(--role-tool-dim)',
    bg: 'var(--role-tool-bg)'
  },
  user: {
    color: 'var(--role-user)',
    dim: 'var(--role-user-dim)',
    bg: 'var(--role-user-bg)'
  }
};

/**
 * RoleTag — the bracketed model-role label, color-coded exactly as the TUI does it.
 * e.g. [reasoner] in cyan, [executor] in green.
 */
function RoleTag({
  role = 'executor',
  filled = false,
  brackets = true,
  style,
  ...rest
}) {
  const r = ROLES[role] || ROLES.executor;
  const label = brackets ? `[${role}]` : role;
  if (filled) {
    return /*#__PURE__*/React.createElement("span", _extends({
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 7px',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 'var(--weight-medium)',
        letterSpacing: 'var(--tracking-wide)',
        color: r.color,
        background: r.bg,
        border: `1px solid ${r.dim}`,
        borderRadius: 'var(--radius-xs)',
        lineHeight: 1.4,
        ...style
      }
    }, rest), label);
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-wide)',
      color: r.color,
      ...style
    }
  }, rest), label);
}
Object.assign(__ds_scope, { RoleTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/RoleTag.jsx", error: String((e && e.message) || e) }); }

// components/core/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect
} = React;
const BRAILLE = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Spinner — the braille TUI spinner. Cycles BRAILLE frames at ~80ms, matching
 * the StatusBar loading indicator. Optional trailing label ("thinking…").
 */
function Spinner({
  label,
  color = 'var(--status-warn)',
  size = 'var(--text-sm)',
  style,
  ...rest
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(p => (p + 1) % BRAILLE.length), 80);
    return () => clearInterval(id);
  }, []);
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'var(--font-mono)',
      fontSize: size,
      color: 'var(--text-muted)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      color
    }
  }, BRAILLE[i]), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/terminal/CodeBlock.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * CodeBlock — a fenced terminal/code surface. Optional title bar with a label
 * and faux traffic-light dots; mono content with code line-height.
 */
function CodeBlock({
  children,
  label,
  chrome = false,
  accent,
  style,
  ...rest
}) {
  const accentColor = accent ? {
    reasoner: 'var(--role-reasoner)',
    executor: 'var(--role-executor)',
    tool_caller: 'var(--role-tool)',
    brand: 'var(--brand)'
  }[accent] : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: 'var(--bg-canvas)',
      ...style
    }
  }, rest), (label || chrome) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '7px 12px',
      borderBottom: '1px solid var(--border-hair)',
      background: 'var(--bg-panel)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-wide)',
      color: 'var(--text-faint)'
    }
  }, chrome && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 5,
      marginRight: 4
    },
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: '#3A424E',
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: '#3A424E',
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: accentColor || '#3A424E',
      display: 'inline-block'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      color: accentColor || 'var(--text-muted)'
    }
  }, label)), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      padding: 'var(--space-4)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-code)',
      color: 'var(--text-body)',
      overflowX: 'auto',
      whiteSpace: 'pre'
    }
  }, children));
}
Object.assign(__ds_scope, { CodeBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/terminal/CodeBlock.jsx", error: String((e && e.message) || e) }); }

// components/terminal/MessageBubble.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * MessageBubble — a single line/turn of the transcript, styled exactly like the
 * TUI's MessageBubble: user gets a right-aligned rounded blue box; assistant
 * roles get left-aligned text with a dim [role] label; reasoning is dim italic;
 * tool output is amber and dim.
 */
function MessageBubble({
  role = 'executor',
  children,
  streaming = false,
  style,
  ...rest
}) {
  // user → right-aligned rounded blue bubble
  if (role === 'user') {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: '78%',
        padding: '7px 12px',
        border: '1px solid var(--role-user)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--role-user-bg)',
        color: 'var(--role-user)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        lineHeight: 'var(--leading-code)',
        whiteSpace: 'pre-wrap'
      }
    }, children));
  }

  // reasoning → dim italic, cyan-tinted, [reasoner] tag
  if (role === 'reasoner') {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        fontStyle: 'italic',
        lineHeight: 'var(--leading-code)',
        color: 'var(--role-reasoner-dim)',
        whiteSpace: 'pre-wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--role-reasoner)'
      }
    }, "[reasoning] "), children), /*#__PURE__*/React.createElement(__ds_scope.RoleTag, {
      role: "reasoner",
      style: {
        alignSelf: 'flex-start',
        opacity: 0.7
      }
    }));
  }

  // tool → amber dim
  if (role === 'tool_caller') {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        lineHeight: 'var(--leading-code)',
        color: 'var(--role-tool-dim)',
        whiteSpace: 'pre-wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--role-tool)'
      }
    }, "[tool] "), children), /*#__PURE__*/React.createElement(__ds_scope.RoleTag, {
      role: "tool_caller",
      style: {
        alignSelf: 'flex-start',
        opacity: 0.7
      }
    }));
  }

  // executor (default assistant answer) → bright body + dim [executor] label
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-code)',
      color: 'var(--text-bright)',
      whiteSpace: 'pre-wrap'
    }
  }, children, streaming && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      display: 'inline-block',
      width: '0.55em',
      height: '1.05em',
      marginLeft: 2,
      transform: 'translateY(0.18em)',
      background: 'var(--role-executor)'
    }
  })), /*#__PURE__*/React.createElement(__ds_scope.RoleTag, {
    role: streaming ? 'executor' : role,
    style: {
      opacity: 0.7
    }
  }));
}
Object.assign(__ds_scope, { MessageBubble });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/terminal/MessageBubble.jsx", error: String((e && e.message) || e) }); }

// components/terminal/Prompt.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect
} = React;
/**
 * Prompt — the input line. A cyan '>' chevron, the (mono) text, and a blinking
 * cursor block. Visual-only by default; pass `value`/`onChange` to make it live.
 */
function Prompt({
  value = '',
  onChange,
  placeholder = '',
  chevron = '>',
  blink = true,
  style,
  ...rest
}) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (!blink) return;
    const id = setInterval(() => setOn(o => !o), 530);
    return () => clearInterval(id);
  }, [blink]);
  const showPlaceholder = !value;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-bright)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      color: 'var(--brand)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, chevron), onChange ? /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    style: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--text-bright)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      caretColor: 'var(--brand)'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: showPlaceholder ? 'var(--text-ghost)' : 'var(--text-bright)'
    }
  }, showPlaceholder ? placeholder : value, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      display: 'inline-block',
      width: '0.55em',
      height: '1.05em',
      marginLeft: 1,
      transform: 'translateY(0.18em)',
      background: 'var(--brand)',
      opacity: on ? 1 : 0
    }
  })));
}
Object.assign(__ds_scope, { Prompt });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/terminal/Prompt.jsx", error: String((e && e.message) || e) }); }

// components/terminal/StatusBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const MODE_LABELS = {
  think_then_answer: 'think-then-answer',
  planner_executor: 'planner-executor',
  manual: 'manual'
};

/**
 * StatusBar — the top chrome of the TUI: bold "mrx", current mode, and the
 * active reasoner/executor models, separated by dim pipes. Mirrors StatusBar.tsx.
 */
function StatusBar({
  mode = 'think_then_answer',
  reasoner = 'ollama/qwen3:14b',
  executor = 'openai/gpt-4o-mini',
  loading = false,
  style,
  ...rest
}) {
  const Sep = () => /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-ghost)',
      padding: '0 2px'
    }
  }, "\u2502");
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      padding: '7px 14px',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-panel)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-bright)',
      fontWeight: 'var(--weight-bold)'
    }
  }, "mrx"), /*#__PURE__*/React.createElement(Sep, null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, MODE_LABELS[mode] || mode), /*#__PURE__*/React.createElement(Sep, null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--role-reasoner-dim)'
    }
  }, "reasoner: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--role-reasoner)'
    }
  }, reasoner)), /*#__PURE__*/React.createElement(Sep, null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--role-executor-dim)'
    }
  }, "executor: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--role-executor)'
    }
  }, executor)), loading && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Sep, null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--status-warn)'
    }
  }, "\u2839")));
}
Object.assign(__ds_scope, { StatusBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/terminal/StatusBar.jsx", error: String((e && e.message) || e) }); }

// components/terminal/TerminalWindow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * TerminalWindow — a framed terminal surface with a title bar (traffic lights +
 * title). The canonical container for showing mrx running. Children render on
 * the terminal void canvas.
 */
function TerminalWindow({
  children,
  title = 'mrx — chat',
  glow = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--bg-canvas)',
      boxShadow: glow ? 'var(--glow-brand), var(--shadow-lg)' : 'var(--shadow-lg)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 14px',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 7
    },
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#F0757E',
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#E5B567',
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#5BD68A',
      display: 'inline-block'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-wide)',
      color: 'var(--text-faint)',
      margin: '0 auto'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-4)'
    }
  }, children));
}
Object.assign(__ds_scope, { TerminalWindow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/terminal/TerminalWindow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cli/chat.jsx
try { (() => {
// mrx CLI UI kit — interactive `mrx chat` TUI recreation.
// Composes the design-system primitives (StatusBar, MessageBubble, Prompt,
// Button, KeyHint, RoleTag, Spinner) from the compiled bundle.
const {
  useState,
  useRef,
  useEffect,
  useCallback
} = React;
const NS = window.MrxDesignSystem_1d8204;
const {
  StatusBar,
  MessageBubble,
  Prompt,
  Button,
  KeyHint,
  RoleTag,
  Spinner,
  Badge
} = NS;
const MODES = ['think_then_answer', 'planner_executor', 'manual'];
const MODE_LABELS = {
  think_then_answer: 'think-then-answer',
  planner_executor: 'planner-executor',
  manual: 'manual'
};

// Canned, on-brand responses keyed loosely by intent.
const CANNED = [{
  match: /recursion/i,
  reasoning: 'recursion = a function defined in terms of itself; need a base case to terminate plus a recursive case that shrinks the input. best explained with a tiny example, not theory.',
  answer: 'Recursion is when a function calls itself to solve a smaller piece of the\nsame problem. Two parts:\n\n  1. base case   — when to stop (e.g. n === 0)\n  2. recursive   — call itself on a smaller input\n\n  function factorial(n) {\n    if (n === 0) return 1;        // base\n    return n * factorial(n - 1);  // recursive\n  }\n\nEach call waits on the next until the base case unwinds the stack.'
}, {
  match: /rest|api|todo/i,
  reasoning: 'user wants a REST design for todos. cover the resource, the 5 CRUD routes, sensible status codes. keep it terse — they can ask for auth/pagination next.',
  answer: 'A todo resource needs five routes:\n\n  GET    /todos        → 200  list\n  POST   /todos        → 201  create\n  GET    /todos/:id    → 200 | 404\n  PATCH  /todos/:id    → 200 | 404  partial update\n  DELETE /todos/:id    → 204 | 404\n\nReturn the created object on POST, an empty body on DELETE. Add\n?status=open&limit=20 for filtering + pagination when you need it.',
  tool: 'web_fetch https://restfulapi.net → 1 result'
}, {
  match: /sql|nosql|database/i,
  reasoning: 'classic trade-off question. structure: consistency + relations favor SQL; scale + flexible schema favor NoSQL. give the heuristic, not a wall of text.',
  answer: 'Rule of thumb:\n\n  SQL    → relational data, transactions, strong consistency,\n           reporting/joins. (Postgres is the safe default.)\n  NoSQL  → flexible/evolving schema, massive horizontal scale,\n           document or key-value access patterns.\n\nFor a social network: SQL for the core graph + accounts; reach for a\ndocument/cache store for feeds and hot reads.'
}];
const FALLBACK = {
  reasoning: 'parse the request, decide the shortest correct response, hand the conclusion to the executor to phrase.',
  answer: 'Here\'s a concise take. mrx routes this through the reasoner first, then\nthe executor writes the final answer you\'re reading now — two models,\none turn. Try asking about recursion, a REST API, or SQL vs NoSQL.'
};
function pickResponse(text) {
  const stripped = text.replace(/^@\w+\s*/, '');
  return CANNED.find(c => c.match.test(stripped)) || FALLBACK;
}
const EXAMPLES = ['explain recursion', 'design a REST API for a todo app', 'trade-offs: SQL vs NoSQL?'];
let idSeq = 0;
const uid = () => `m${idSeq++}`;
function Banner() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 2px 14px',
      borderBottom: '1px solid var(--border-hair)',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      color: 'var(--brand)',
      fontSize: 13,
      lineHeight: 1.15,
      fontFamily: 'var(--font-mono)',
      fontWeight: 700
    }
  }, `                       
 _ __ ___  _ __ __  __  
| '_ \` _ \\| '__|\\ \\/ /  
| | | | | | |    >  <   
|_| |_| |_|_|   /_/\\_\\  `), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)'
    }
  }, "Multi-role model orchestration. ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)'
    }
  }, "No config required \u2014 defaults to Ollama. Make sure "), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--role-reasoner)'
    }
  }, "ollama"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)'
    }
  }, " is running locally.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 14,
      flexWrap: 'wrap'
    }
  }, EXAMPLES.map(ex => /*#__PURE__*/React.createElement("span", {
    key: ex,
    "data-ex": ex,
    className: "ex-chip",
    style: {
      cursor: 'pointer',
      padding: '5px 10px',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-panel)',
      transition: 'border-color var(--dur-fast), color var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, ">"), " ", ex))));
}
function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('think_then_answer');
  const [showReasoning, setShowReasoning] = useState(true);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(null); // {text}
  const scrollRef = useRef(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming, busy]);
  const after = (ms, fn) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };
  const send = useCallback(raw => {
    const text = raw.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    const manualPrefix = mode === 'manual' ? text.match(/^@(\w+)/)?.[1] || 'executor' : null;
    setMessages(m => [...m, {
      id: uid(),
      role: 'user',
      content: text
    }]);
    const resp = pickResponse(text);

    // Manual @reasoner → just the reasoner answers.
    if (manualPrefix === 'reasoner') {
      after(700, () => {
        setMessages(m => [...m, {
          id: uid(),
          role: 'reasoner',
          content: resp.reasoning
        }]);
        setBusy(false);
      });
      return;
    }

    // 1) reasoner thinks
    after(650, () => {
      if (showReasoning && mode !== 'manual') {
        setMessages(m => [...m, {
          id: uid(),
          role: 'reasoner',
          content: resp.reasoning
        }]);
      }
      // 2) optional tool call
      const toolDelay = resp.tool ? 600 : 0;
      if (resp.tool) {
        after(450, () => setMessages(m => [...m, {
          id: uid(),
          role: 'tool_caller',
          content: resp.tool
        }]));
      }
      // 3) executor streams
      after(500 + toolDelay, () => {
        const full = resp.answer;
        let i = 0;
        setStreaming({
          text: ''
        });
        const step = () => {
          i += Math.max(2, Math.round(full.length / 90));
          const slice = full.slice(0, i);
          setStreaming({
            text: slice
          });
          if (i < full.length) {
            after(28, step);
          } else {
            setStreaming(null);
            setMessages(m => [...m, {
              id: uid(),
              role: 'executor',
              content: full
            }]);
            setBusy(false);
          }
        };
        step();
      });
    });
  }, [busy, mode, showReasoning]);

  // example chip clicks
  useEffect(() => {
    const h = e => {
      const chip = e.target.closest('.ex-chip');
      if (chip && !busy) send(chip.getAttribute('data-ex'));
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [send, busy]);

  // keyboard: Enter handled by input; Ctrl+M / Ctrl+R global
  useEffect(() => {
    const h = e => {
      if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        cycleMode();
      }
      if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        setShowReasoning(s => !s);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
  const cycleMode = () => setMode(cur => MODES[(MODES.indexOf(cur) + 1) % MODES.length]);
  const visible = messages.filter(m => !(m.role === 'reasoner' && !showReasoning));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--bg-canvas)',
      boxShadow: 'var(--glow-brand), var(--shadow-lg)',
      display: 'flex',
      flexDirection: 'column',
      height: 660
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 14px',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#F0757E'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#E5B567'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#5BD68A'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      margin: '0 auto',
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-wide)',
      color: 'var(--text-faint)'
    }
  }, "mrx \u2014 chat"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 14px',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement(StatusBar, {
    mode: mode,
    reasoner: "ollama/qwen3:14b",
    executor: "openai/gpt-4o-mini",
    loading: busy
  })), /*#__PURE__*/React.createElement("div", {
    ref: scrollRef,
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px 16px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, messages.length === 0 && /*#__PURE__*/React.createElement(Banner, null), visible.map(m => /*#__PURE__*/React.createElement(MessageBubble, {
    key: m.id,
    role: m.role
  }, m.content)), streaming && /*#__PURE__*/React.createElement(MessageBubble, {
    role: "executor",
    streaming: true
  }, streaming.text), busy && !streaming && /*#__PURE__*/React.createElement(Spinner, {
    label: mode === 'planner_executor' ? 'planning…' : 'thinking…',
    color: "var(--role-reasoner)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-default)',
      background: 'var(--bg-panel)',
      padding: '12px 16px'
    }
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      send(input);
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)',
      fontWeight: 600
    }
  }, ">"), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: input,
    onChange: e => setInput(e.target.value),
    placeholder: mode === 'manual' ? 'try @reasoner … / @executor …' : 'ask anything…',
    disabled: busy,
    style: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--text-bright)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      caretColor: 'var(--brand)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      marginTop: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(KeyHint, {
    keys: "Enter",
    label: "send"
  }), /*#__PURE__*/React.createElement("span", {
    onClick: cycleMode,
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(KeyHint, {
    keys: "Ctrl+M",
    label: "mode"
  })), /*#__PURE__*/React.createElement("span", {
    onClick: () => setShowReasoning(s => !s),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(KeyHint, {
    keys: "Ctrl+R",
    label: `reasoning ${showReasoning ? 'on' : 'off'}`
  })), /*#__PURE__*/React.createElement(KeyHint, {
    keys: "Ctrl+C",
    label: "quit"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-ghost)'
    }
  }, "mode"), /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    dot: true
  }, MODE_LABELS[mode])))));
}
window.ChatApp = ChatApp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cli/chat.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/marketing.jsx
try { (() => {
// mrx marketing landing page — brand-applied surface built from README content.
// Composes design-system primitives from the compiled bundle.
const {
  useState,
  useEffect
} = React;
const NS = window.MrxDesignSystem_1d8204;
const {
  Button,
  Badge,
  RoleTag,
  CodeBlock,
  StatusBar,
  MessageBubble,
  KeyHint
} = NS;
const MAXW = 1120;

/* ── shared bits ─────────────────────────────────────────────── */
function Eyebrow({
  children,
  color = 'var(--brand)'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 1,
      background: color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color
    }
  }, children));
}
function Section({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: MAXW,
      margin: '0 auto',
      padding: '0 32px',
      ...style
    }
  }, children);
}

/* ── nav ─────────────────────────────────────────────────────── */
function Nav() {
  const links = ['Modes', 'Providers', 'Docs'];
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'rgba(11,14,18,0.82)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-hair)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAXW,
      margin: '0 auto',
      padding: '14px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/mrx-mark.svg",
    width: "26",
    height: "26",
    alt: ""
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 'var(--text-md)',
      color: 'var(--text-bright)'
    }
  }, "mrx"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    style: {
      marginLeft: 2
    }
  }, "v0.1.0")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 22
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: `#${l.toLowerCase()}`,
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, l)), /*#__PURE__*/React.createElement("a", {
    href: "https://github.com/Varun-SV/mrx",
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "GitHub \u2197"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    prefix: "\u203A"
  }, "npm i -g mrx"))));
}

/* ── hero ────────────────────────────────────────────────────── */
function HeroTerminal() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--bg-canvas)',
      boxShadow: 'var(--glow-brand), var(--shadow-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 14px',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#F0757E'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#E5B567'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#5BD68A'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      margin: '0 auto',
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-wide)',
      color: 'var(--text-faint)'
    }
  }, "mrx \u2014 chat"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(StatusBar, {
    mode: "think_then_answer",
    reasoner: "ollama/qwen3:14b",
    executor: "openai/gpt-4o-mini",
    loading: true
  }), /*#__PURE__*/React.createElement(MessageBubble, {
    role: "user"
  }, "design a REST API for a todo app"), /*#__PURE__*/React.createElement(MessageBubble, {
    role: "reasoner"
  }, "the user wants CRUD endpoints with clear status codes\u2026"), /*#__PURE__*/React.createElement(MessageBubble, {
    role: "executor",
    streaming: true
  }, 'A todo resource needs five routes:\n  GET /todos · POST /todos · GET/PATCH/DELETE /todos/:id'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      borderTop: '1px solid var(--border-hair)',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)',
      fontWeight: 600
    }
  }, ">"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)',
      fontSize: 'var(--text-sm)'
    }
  }, "@reasoner what about pagination?"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 16,
      background: 'var(--brand)',
      marginLeft: -2
    }
  }))));
}
function Hero() {
  return /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingTop: 80,
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 56,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Multi-role model orchestration CLI"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-3xl)',
      lineHeight: 'var(--leading-tight)',
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--text-bright)',
      margin: '0 0 22px'
    }
  }, "Assign different LLMs to ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--role-reasoner)'
    }
  }, "different roles"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-md)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-muted)',
      maxWidth: '46ch',
      margin: '0 0 28px'
    }
  }, "A reasoner for planning, an executor for output, a tool caller for the world \u2014 in a single interactive session. Mix Ollama, OpenAI, Anthropic, Gemini, LM Studio and OpenRouter from one config file."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    prefix: "\u203A",
    size: "lg"
  }, "Get started"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg"
  }, "Read the docs")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 360
    }
  }, /*#__PURE__*/React.createElement(CodeBlock, {
    label: "bash",
    chrome: true
  }, 'npm install -g mrx\nmrx ask "explain recursion"'))), /*#__PURE__*/React.createElement(HeroTerminal, null)));
}

/* ── why mrx ─────────────────────────────────────────────────── */
const WHY = [{
  t: 'Role separation',
  c: 'var(--role-reasoner)',
  d: 'Use a powerful reasoning model for planning and a fast executor for output. Stop paying reasoning prices for every token.'
}, {
  t: 'Provider-agnostic',
  c: 'var(--role-executor)',
  d: 'Mix Ollama, OpenAI, Anthropic, Google Gemini, LM Studio and OpenRouter in the same session. One config file, zero vendor lock-in.'
}, {
  t: 'Zero lock-in',
  c: 'var(--role-tool)',
  d: 'Fully open source (MIT). Your config, your models, your data. Run entirely local with Ollama, or route to frontier APIs.'
}];
function Why() {
  return /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "var(--role-executor)"
  }, "Why mrx"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16
    }
  }, WHY.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: w.t,
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderTop: `2px solid ${w.c}`,
      borderRadius: 'var(--radius-md)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-ghost)',
      marginBottom: 14
    }
  }, "0", i + 1), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 10px',
      fontSize: 'var(--text-lg)',
      fontWeight: 600,
      color: 'var(--text-bright)'
    }
  }, w.t), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-muted)'
    }
  }, w.d)))));
}

/* ── modes ───────────────────────────────────────────────────── */
const MODES = [{
  role: 'reasoner',
  name: 'think_then_answer',
  tag: 'default',
  blurb: 'The reasoner thinks through the problem inside <thinking> tags. The executor then writes the user-facing response using that reasoning as context.',
  diagram: 'user\n  │\n  ▼\n[ reasoner ]  ← <thinking>…\n  │ conclusion\n  ▼\n[ executor ]  → final answer'
}, {
  role: 'executor',
  name: 'planner_executor',
  tag: 'multi-step',
  blurb: 'The reasoner produces a numbered plan. The executor runs each step in sequence — passing prior results forward — then synthesizes a final answer.',
  diagram: 'user\n  │\n  ▼\n[ reasoner ]  → 1. 2. 3.\n  ├─ step 1 → executor\n  ├─ step 2 → executor\n  └─ step 3 → executor\n         ▼  synthesize'
}, {
  role: 'tool_caller',
  name: 'manual',
  tag: 'power user',
  blurb: 'You route every message yourself with an @prefix. No prefix falls through to the executor — explicit control over which model handles what.',
  diagram: '@reasoner …  → reasoner\n@executor …  → executor\n@tool_caller → tool_caller\n(no prefix)  → executor'
}];
function Modes() {
  return /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement("a", {
    id: "modes"
  }), /*#__PURE__*/React.createElement(Eyebrow, {
    color: "var(--role-reasoner)"
  }, "Interaction modes"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-2xl)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--text-bright)',
      margin: '0 0 8px'
    }
  }, "Three ways to route a turn."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      margin: '0 0 32px',
      maxWidth: '60ch'
    }
  }, "Switch any time with ", /*#__PURE__*/React.createElement("code", {
    style: {
      color: 'var(--brand)'
    }
  }, "--mode"), " or ", /*#__PURE__*/React.createElement("code", {
    style: {
      color: 'var(--brand)'
    }
  }, "Ctrl+M"), " in the TUI."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16
    }
  }, MODES.map(m => /*#__PURE__*/React.createElement("div", {
    key: m.name,
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-hair)'
    }
  }, /*#__PURE__*/React.createElement(RoleTag, {
    role: m.role,
    filled: true
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    style: {
      marginLeft: 'auto'
    }
  }, m.tag)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("code", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-bright)',
      fontWeight: 600
    }
  }, m.name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-xs)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-muted)'
    }
  }, m.blurb), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: '4px 0 0',
      padding: 12,
      background: 'var(--bg-canvas)',
      border: '1px solid var(--border-hair)',
      borderRadius: 'var(--radius-sm)',
      fontSize: 11,
      lineHeight: 1.5,
      color: 'var(--text-faint)',
      overflowX: 'auto'
    }
  }, m.diagram))))));
}

/* ── providers ───────────────────────────────────────────────── */
const PROVIDERS = [{
  n: 'Ollama',
  e: '(none)',
  s: 'ollama pull qwen3:8b',
  local: true
}, {
  n: 'OpenAI',
  e: 'OPENAI_API_KEY',
  s: 'platform.openai.com',
  local: false
}, {
  n: 'Anthropic',
  e: 'ANTHROPIC_API_KEY',
  s: 'console.anthropic.com',
  local: false
}, {
  n: 'Google Gemini',
  e: 'GOOGLE_API_KEY',
  s: 'aistudio.google.com',
  local: false
}, {
  n: 'LM Studio',
  e: '(none)',
  s: 'local server',
  local: true
}, {
  n: 'OpenRouter',
  e: 'OPENROUTER_API_KEY',
  s: 'openrouter.ai/keys',
  local: false
}];
function Providers() {
  return /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement("a", {
    id: "providers"
  }), /*#__PURE__*/React.createElement(Eyebrow, {
    color: "var(--role-tool)"
  }, "Providers"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-2xl)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--text-bright)',
      margin: '0 0 28px'
    }
  }, "One config. Zero vendor lock-in."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 12
    }
  }, PROVIDERS.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.n,
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-base)',
      fontWeight: 600,
      color: 'var(--text-bright)'
    }
  }, p.n), p.local ? /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true,
    style: {
      marginLeft: 'auto'
    }
  }, "local") : /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    style: {
      marginLeft: 'auto'
    }
  }, "API key")), /*#__PURE__*/React.createElement("code", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: p.e === '(none)' ? 'var(--text-ghost)' : 'var(--role-tool)'
    }
  }, p.e), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-faint)'
    }
  }, p.s)))));
}

/* ── install / cta ───────────────────────────────────────────── */
function Install() {
  return /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingBottom: 110
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: '48px 40px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(500px 200px at 50% 0%, rgba(69,200,219,0.08), transparent 70%)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement(Eyebrow, {
    color: "var(--brand)"
  }, "Get started"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-2xl)',
      fontWeight: 700,
      color: 'var(--text-bright)',
      margin: '0 auto 14px',
      maxWidth: '20ch'
    }
  }, "No config required. Defaults to Ollama."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      margin: '0 auto 28px',
      maxWidth: '48ch'
    }
  }, "Install globally, point it at your models, and start a session. Make sure ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--role-reasoner)'
    }
  }, "ollama"), " is running locally."), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 440,
      margin: '0 auto',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(CodeBlock, {
    label: "bash",
    chrome: true,
    accent: "brand"
  }, 'npm install -g mrx\nmrx chat')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      justifyContent: 'center',
      marginTop: 26,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(KeyHint, {
    keys: "Enter",
    label: "send"
  }), /*#__PURE__*/React.createElement(KeyHint, {
    keys: "Ctrl+M",
    label: "mode"
  }), /*#__PURE__*/React.createElement(KeyHint, {
    keys: "Ctrl+R",
    label: "reasoning"
  }), /*#__PURE__*/React.createElement(KeyHint, {
    keys: "Ctrl+C",
    label: "quit"
  }))));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-hair)',
      padding: '28px 0'
    }
  }, /*#__PURE__*/React.createElement(Section, {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/mrx-mark.svg",
    width: "22",
    height: "22",
    alt: ""
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)'
    }
  }, "mrx \u2014 Multi-Role Model Orchestration CLI"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-ghost)'
    }
  }, "MIT \xA9 Varun S V \xB7 github.com/Varun-SV/mrx")));
}
function Landing() {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Nav, null), /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(Why, null), /*#__PURE__*/React.createElement(Modes, null), /*#__PURE__*/React.createElement(Providers, null), /*#__PURE__*/React.createElement(Install, null), /*#__PURE__*/React.createElement(Footer, null));
}
window.Landing = Landing;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/marketing.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.KeyHint = __ds_scope.KeyHint;

__ds_ns.RoleTag = __ds_scope.RoleTag;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.CodeBlock = __ds_scope.CodeBlock;

__ds_ns.MessageBubble = __ds_scope.MessageBubble;

__ds_ns.Prompt = __ds_scope.Prompt;

__ds_ns.StatusBar = __ds_scope.StatusBar;

__ds_ns.TerminalWindow = __ds_scope.TerminalWindow;

})();
