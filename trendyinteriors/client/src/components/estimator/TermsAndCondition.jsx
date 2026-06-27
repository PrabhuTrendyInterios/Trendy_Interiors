import React, { useEffect, useRef, useState } from 'react';

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
    'By submitting this design estimate request, you acknowledge that the quotation is a preliminary proposal based on the information provided during the estimator process.',
    'All pricing is indicative and may change after site inspection, final measurements, material selection, or scope clarification. Final pricing will be confirmed during the official consultation or project discussion.',
    'Selected add-ons, package components, and layout materials are treated as optional choices and will only be included in the final scope if they remain confirmed at the time of project confirmation.',
    'Trendy Interiors reserves the right to revise the estimate if additional requirements, site conditions, or customization requests are introduced after submission.',
    'By ticking the confirmation box below, you confirm that you have reviewed the estimate and understand that the final project cost may be adjusted before execution.',
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 22, 18, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        zIndex: 1100,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '88vh',
          overflow: 'hidden',
          backgroundColor: '#fffdf3',
          borderRadius: '14px',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.32)',
          border: '2px solid var(--color-gold)',
          color: 'var(--color-charcoal-dark)',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            padding: '1.5rem 1.5rem 1.15rem',
            backgroundColor: '#fffdf3',
            borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 0.35rem 0',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-gold-dark)',
              }}
            >
              Estimate Agreement
            </p>
            <h3
              id="terms-title"
              style={{
                margin: 0,
                color: 'var(--color-charcoal-dark)',
                fontSize: '1.45rem',
                lineHeight: 1.2,
              }}
            >
              Terms & Conditions
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close terms and conditions"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              backgroundColor: '#ffffff',
              color: 'var(--color-charcoal-dark)',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '1.35rem',
              lineHeight: 1,
              boxShadow: '0 8px 18px rgba(43, 43, 43, 0.08)',
            }}
          >
            ×
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            maxHeight: 'calc(88vh - 170px)',
            overflowY: 'auto',
            padding: '1.35rem 1.5rem 1.5rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: '0.85rem',
              color: 'var(--color-charcoal-dark)',
              lineHeight: 1.65,
              fontSize: '0.95rem',
            }}
          >
            {terms.map((term, index) => (
              <div
                key={term}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '34px 1fr',
                  gap: '0.8rem',
                  alignItems: 'flex-start',
                  padding: '0.95rem 1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(212, 175, 55, 0.18)',
                  borderRadius: '10px',
                  boxShadow: '0 8px 22px rgba(43, 43, 43, 0.045)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(212, 175, 55, 0.14)',
                    color: 'var(--color-gold-dark)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                  }}
                >
                  {index + 1}
                </span>
                <p style={{ margin: 0 }}>{term}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1rem 1.5rem',
            backgroundColor: '#fffdf3',
            borderTop: '1px solid rgba(212, 175, 55, 0.25)',
          }}
        >
          <p style={{ margin: 0, color: canAccept ? 'var(--color-gray)' : 'var(--color-gold-dark)', fontSize: '0.86rem', lineHeight: 1.4 }}>
            {canAccept ? 'You can now accept the terms.' : 'Please scroll to the end to enable acceptance.'}
          </p>
          <button
            type="button"
            disabled={!canAccept}
            onClick={onAccept}
            style={{
              border: 'none',
              borderRadius: '10px',
              padding: '0.8rem 1.2rem',
              background: canAccept
                ? 'linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-dark) 100%)'
                : 'rgba(43, 43, 43, 0.12)',
              color: canAccept ? '#ffffff' : 'var(--color-gray)',
              cursor: canAccept ? 'pointer' : 'not-allowed',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: canAccept ? '0 8px 18px rgba(212, 175, 55, 0.25)' : 'none',
            }}
          >
            I have read and agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndCondition;
