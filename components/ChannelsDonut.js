import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { VictoryPie } from 'victory-native';

const BRAND_COLORS = {
  whatsapp: '#25D366',
  facebook: '#1877F2',
  instagram: '#E1306C',
  'live chat': '#10B981',
  sms: '#0EA5E9',
  telegram: '#26A5E4',
  email: '#F59E0B',
  'call center': '#FF8A00',
};

const FALLBACK = ['#115BC7', '#8B5CF6', '#06B6D4', '#EF4444', '#10B981', '#A3A3A3'];

const colorFor = (name, idx) => {
  const key = (name || '').toLowerCase().trim();
  return BRAND_COLORS[key] || FALLBACK[idx % FALLBACK.length];
};

export default function ChannelsDonutCard({ channels }) {
  const { slices, total } = useMemo(() => {
    if (!channels || !channels.length) return { slices: [], total: 0 };

    const sorted = [...channels].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    const othersValue = rest.reduce((acc, c) => acc + (c.value || 0), 0);
    const list = othersValue > 0 ? [...top, { name: 'Others', value: othersValue }] : top;

    const mapped = list.map((c, i) => ({
      x: c.name,
      y: c.value || 0,
      color: c.name === 'Others' ? '#A3A3A3' : colorFor(c.name, i),
    }));

    const sum = mapped.reduce((a, s) => a + s.y, 0);
    return { slices: mapped, total: sum };
  }, [channels]);

  return (
    <View
      style={{
        backgroundColor: '#FFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DFE1E6',
        paddingTop: 15,
        marginTop: 15,
      }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 15, paddingBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>Channels</Text>
      </View>

      {/* subtle divider */}
      <View style={{ height: 2, backgroundColor: '#E8EEF4', marginHorizontal: 15 }} />

      {/* Body */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 15 }}>
        {/* Donut */}
        <View style={{ width: 170, height: 170, justifyContent: 'center', alignItems: 'center' }}>
          <VictoryPie
            data={slices}
            width={170}
            height={170}
            innerRadius={55}
            padAngle={2}
            cornerRadius={3}
            colorScale={slices.map(s => s.color)}
            labels={() => null}
          />
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>Total</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{total}</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={{ flex: 1, paddingLeft: 12 }}>
          {slices.map(item => (
            <View key={item.x} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: item.color,
                  marginRight: 8,
                }}
              />
              <Text style={{ flex: 1, color: '#111827' }} numberOfLines={1}>
                {item.x}
              </Text>
              <Text style={{ marginLeft: 8, fontWeight: '700', color: '#111827' }}>
                {item.y}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
