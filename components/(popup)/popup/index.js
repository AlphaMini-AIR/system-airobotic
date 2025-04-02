'use client'

import React from "react";
import ReactDOM from "react-dom";
import styles from "./index.module.css";

const Dialog = React.memo(function Dialog({
    open,
    onClose,
    title,
    body,
    button,
    width,
    height,
}) {
    if (!open) return null;
    const dialogStyle = {
        width: width || "auto",
        height: height || "auto",
    };

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.dialog}
                style={dialogStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {title && <h2 className={`${styles.title} text_3`}>{title}</h2>}
                {body && <div className={styles.body}>{body}</div>}
                {button && <div className={styles.button}>{button}</div>}
            </div>
        </div>,
        document.body
    );
});

export default Dialog;
