import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './TermsAndCondition.css';

const TermsAndCondition = ({ isOpen, onClose, onAccept, hasAccepted = false }) => {
  const scrollRef = useRef(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasReachedEnd(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const element = scrollRef.current;
      if (!element) {
        return;
      }

      const isScrollable = element.scrollHeight > element.clientHeight + 4;
      setHasReachedEnd(!isScrollable || hasAccepted);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [hasAccepted, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleScroll = (event) => {
    const element = event.currentTarget;
    const reachedEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 8;

    if (reachedEnd) {
      setHasReachedEnd(true);
    }
  };

  const canAccept = hasReachedEnd || hasAccepted;

  const terms = [
    'By submitting this design estimate request, you acknowledge that the quotation is a preliminary proposal based on the information provided during the Quote Interior Yourself process.',
    'All pricing is indicative and may change after site inspection, final measurements, material selection, or scope clarification. Final pricing will be confirmed during the official consultation or project discussion.',
    'Selected add-ons, package components, and layout materials are treated as optional choices and will only be included in the final scope if they remain confirmed at the time of project confirmation.',
    'Trendy Interiors reserves the right to revise the estimate if additional requirements, site conditions, or customization requests are introduced after submission.',
    'By ticking the confirmation box below, you confirm that you have reviewed the estimate and understand that the final project cost may be adjusted before execution.',
  ];

  return createPortal(
    <div className="terms-overlay" onClick={onClose}>
      <div className="terms-dialog" role="dialog" aria-modal="true" aria-labelledby="terms-title" onClick={(e) => e.stopPropagation()}>
        <div className="terms-header">
          <div>
            <p>Estimate Agreement</p>
            <h3 id="terms-title">Terms & Conditions</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close terms and conditions" className="terms-close-btn">×</button>
        </div>

        <div className="terms-body" ref={scrollRef} onScroll={handleScroll}>
          <div className="terms-grid">
            {terms.map((term, index) => (
              <div key={term} className="terms-item">
                <span className="terms-item-index">{index + 1}</span>
                <p>{term}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="terms-footer">
          <p className="terms-accept-note">
            {canAccept ? 'You can now accept the terms.' : 'Please scroll to the end to enable acceptance.'}
          </p>
          <button
            type="button"
            disabled={!canAccept}
            onClick={onAccept}
            className={`terms-accept-btn ${canAccept ? 'enabled' : 'disabled'}`}
          >
            I have read and agree
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TermsAndCondition;
