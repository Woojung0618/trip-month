import { useState, useEffect } from 'react'
import type { Destination } from '../api/client'
import { getDestinationMonths } from '../api/client'
import { codeToNameKo } from '../data/countries'

const CTA_LABEL = '트립닷컴 항공권 최저가 확인하기'
const AFFILIATE_NOTE = '제휴 링크를 통해 항공권 구매 시 사이트 운영자에게 소정의 수수료가 지급됩니다.'

interface DestinationDetailProps {
  destination: Destination
  onClose: () => void
}

export default function DestinationDetail({ destination, onClose }: DestinationDetailProps) {
  const {
    name,
    tagline,
    country: countryCode,
    weather,
    temperature,
    reason,
    imageUrl,
    averageFlightPrice,
    affiliateUrl,
    affiliateNote,
    flightTime,
    month,
  } = destination

  const [isExiting, setIsExiting] = useState(false)
  const [recommendedMonths, setRecommendedMonths] = useState<number[]>([month])

  const handleClose = () => {
    if (isExiting) return
    setIsExiting(true)
  }
  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (isExiting && e.animationName === 'destination-detail-modal-out') {
      onClose()
    }
  }

  useEffect(() => {
    getDestinationMonths(name, countryCode)
      .then((months) => setRecommendedMonths(months.length > 0 ? months : [month]))
      .catch(() => setRecommendedMonths([month]))
  }, [name, countryCode, month])

  const countryName = codeToNameKo(countryCode)
  /** 상단 한줄 소개: tagline 우선, 없으면 reason이 짧을 때만 표시 */
  const oneLiner = (tagline && tagline.trim()) ? tagline.trim() : (reason && reason.length <= 60 ? reason : undefined)

  return (
    <div
      className={`destination-detail-overlay ${isExiting ? 'destination-detail--exiting' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-bg-overlay)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
      }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`destination-detail-modal ${isExiting ? 'destination-detail--exiting' : ''}`}
        style={{
          background: 'var(--color-bg)',
          borderRadius: 16,
          maxWidth: 720,
          width: '92%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="닫기"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'var(--color-bg-header)',
            color: 'var(--color-text-secondary)',
            fontSize: '1.25rem',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        {/* 상단 사진 배경: 국가명(small), 도시명(large), 간단한 소개(medium) */}
        <div style={{ position: 'relative', height: 200, background: 'var(--color-border)' }}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--gradient-overlay)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '1rem 1.25rem 1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-overlay)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx={12} cy={10} r={3} />
              </svg>
              <span style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-on-overlay)' }}>
                {countryName}
              </span>
            </div>
            <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text-on-primary)' }}>
              {name}
            </h1>
            {oneLiner && (
              <h3
                style={{
                  margin: '0.35rem 0 0',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--color-text-on-overlay-sub)',
                  lineHeight: 1.35,
                }}
              >
                {oneLiner}
              </h3>
            )}
          </div>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* 정보 카드들 — ref DestinationModal과 동일: 아이콘 + 레이블 + 값 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* 날씨 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: 12,
                background: 'var(--color-bg-weather)',
              }}
            >
              <span style={{ flexShrink: 0, marginTop: 2 }} aria-hidden>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-weather)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </svg>
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>날씨</div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)' }}>{weather || '—'}</div>
                {temperature && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted-2)', marginTop: 2 }}>{temperature}</div>
                )}
              </div>
            </div>
            {/* 항공권 최저가 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: 12,
                background: 'var(--color-bg-price)',
              }}
            >
              <span style={{ flexShrink: 0, marginTop: 2 }} aria-hidden>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-price)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 2.2c.5.2 1 .1 1.3-.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>항공권 최저가</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                  {averageFlightPrice}
                </div>
                {flightTime && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-2)', marginTop: 2 }}>{flightTime}</div>
                )}
              </div>
            </div>
            {/* 추천 시즌 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: 12,
                background: 'var(--color-bg-season)',
              }}
            >
              <span style={{ flexShrink: 0, marginTop: 2 }} aria-hidden>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-season)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
                  <line x1={16} y1={2} x2={16} y2={6} />
                  <line x1={8} y1={2} x2={8} y2={6} />
                  <line x1={3} y1={10} x2={21} y2={10} />
                </svg>
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>추천 시즌</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                  {recommendedMonths.map((m) => `${m}월`).join(', ')}
                </div>
              </div>
            </div>
          </div>

          {/* 여행지 소개 — 긴 문구 */}
          <section style={{ marginBottom: '1.25rem' }}>
            <h3
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              여행지 소개
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                color: 'var(--color-text-secondary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {reason || '소개가 없습니다.'}
            </p>
          </section>

          {/* 버튼 */}
          {affiliateUrl ? (
            <div>
              <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'var(--gradient-cta)',
                  color: 'var(--color-text-on-primary)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-button)',
                }}
              >
                {CTA_LABEL}
              </a>
              
                <p
                  style={{
                    margin: '0.5rem 0 0',
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted-2)',
                    textAlign: 'center',
                  }}
                >
                  {AFFILIATE_NOTE} {affiliateNote && ` ${affiliateNote}`}
                </p>
              
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                background: 'var(--color-bg-subtle)',
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
