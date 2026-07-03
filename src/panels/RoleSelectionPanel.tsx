import { Div, Text, Caption, Spacing } from '@vkontakte/vkui';

export type UserRole = 'driver' | 'passenger';

type Props = {
  onSelect: (role: UserRole) => void;
};

export function RoleSelectionPanel({ onSelect }: Props) {
  return (
    <Div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Text weight="2" style={{ fontSize: 26, marginBottom: 8, color: 'var(--vkui--color_text_primary)' }}>
          ТыГыДыК
        </Text>
        <Caption style={{ color: 'var(--vkui--color_text_secondary)', fontSize: 15 }}>
          Поиск попутчиков по России
        </Caption>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RoleCard
          emoji="🚗"
          title="Поездки"
          subtitle="У вас есть авто и свободные места"
          onClick={() => onSelect('driver')}
          variant="primary"
        />

        <RoleCard
          emoji="🚶"
          title="Ищу машину"
          subtitle="Вам нужна поездка до города"
          onClick={() => onSelect('passenger')}
          variant="secondary"
        />
      </div>

      <Spacing size={40} />

      <Caption
        level="3"
        style={{
          textAlign: 'center',
          color: 'var(--vkui--color_text_tertiary)',
          lineHeight: 1.5,
        }}
      >
        Оренбург, Челябинск, Уфа, Орск и другие города
      </Caption>
    </Div>
  );
}

type RoleCardProps = {
  emoji: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
};

function RoleCard({ emoji, title, subtitle, onClick, variant }: RoleCardProps) {
  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '20px 24px',
        borderRadius: 16,
        border: 'none',
        cursor: 'pointer',
        background: isPrimary
          ? 'linear-gradient(135deg, #4D7BF3 0%, #5B88F4 100%)'
          : 'var(--vkui--color_background_secondary)',
        boxShadow: isPrimary
          ? '0 4px 20px rgba(77, 123, 243, 0.3)'
          : '0 2px 12px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = isPrimary
          ? '0 8px 28px rgba(77, 123, 243, 0.4)'
          : '0 4px 20px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isPrimary
          ? '0 4px 20px rgba(77, 123, 243, 0.3)'
          : '0 2px 12px rgba(0, 0, 0, 0.08)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isPrimary
            ? 'rgba(255, 255, 255, 0.2)'
            : 'var(--vkui--color_background_accent)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 28 }}>{emoji}</span>
      </div>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <Text
          weight="2"
          style={{
            fontSize: 19,
            color: isPrimary ? '#fff' : 'var(--vkui--color_text_primary)',
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Caption
          style={{
            color: isPrimary ? 'rgba(255, 255, 255, 0.85)' : 'var(--vkui--color_text_secondary)',
            fontSize: 14,
          }}
        >
          {subtitle}
        </Caption>
      </div>
      <div style={{ color: isPrimary ? 'rgba(255,255,255,0.7)' : 'var(--vkui--color_icon_secondary)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}
