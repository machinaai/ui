import React from 'react';
import styles from './index.css';
import Demo from './Demo';
export default function() {
  return (
    <div className={styles.normal}>
      <Demo />
      <div className={styles.welcome} />
      <ul className={styles.list}>
        <li>
          To get started, edit <code>src/pages/index.js</code> and save to reload.
        </li>
      </ul>
    </div>
  );
}
