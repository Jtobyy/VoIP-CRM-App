// ActivityBreakdownCard.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { VictoryChart, VictoryAxis, VictoryGroup, VictoryBar } from 'victory-native';

const GREEN = '#3EBF0F'; // Calls
const BLUE  = '#115BC7'; // Messages
const GRID  = '#E8EEF4';
const TICK  = '#6B7280';

export default function ActivityBreakdownCard({
  hours,
  calls,
  messages,
  title = 'Activity Breakdown',
  maxY = 100,
  style,
}) {
  const [cardWidth, setCardWidth] = useState(0);

  // data
  const callsSeries = useMemo(() => hours.map((x, i) => ({ x, y: calls[i] ?? 0 })), [hours, calls]);
  const msgsSeries  = useMemo(() => hours.map((x, i) => ({ x, y: messages[i] ?? 0 })), [hours, messages]);

  // sizing (only chart scrolls)
  const BAR_WIDTH = 14;
  const GROUP_GAP = 18;
  const PER_GROUP = BAR_WIDTH * 2 + GROUP_GAP + 16;
  const chartWidth = Math.max(cardWidth - 32, hours.length * PER_GROUP);

  const yTicks = useMemo(() => [0, 25, 50, 75, 100].map(v => Math.min(v, maxY)), [maxY]);

  return (
    <View
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      style={[
        {
          backgroundColor: '#FFF',
          borderRadius: 16,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
          overflow: 'hidden', // so header divider and fades clip to rounded corners
        },
        style,
      ]}
    >
      {/* HEADER: own padding; bottom divider & extra spacing */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' }}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN, marginRight: 6 }} />
              <Text style={{ color: '#111827' }}>Calls</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE, marginRight: 6 }} />
              <Text style={{ color: '#111827' }}>Messages</Text>
            </View>
          </View>
        </View>

        {/* divider */}
        <View style={{ height: 1, backgroundColor: GRID }} />
      </View>

      {/* BODY: only this area scrolls; header remains fixed */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 0, paddingLeft: 0, paddingBottom: 0 }}
      >
        <VictoryChart
          width={chartWidth}
          height={220}
          domainPadding={{ x: 28, y: [8, 12] }}
          padding={{ top: 4, right: 8, bottom: 40, left: 44 }}
        >
          <VictoryAxis
            dependentAxis
            tickValues={yTicks}
            tickFormat={(t) => `${t}`}
            style={{
              axis: { stroke: 'transparent' },
              grid: { stroke: GRID, strokeWidth: 1 },
              ticks: { stroke: 'transparent' },
              tickLabels: { fill: TICK, fontSize: 12 },
            }}
            domain={[0, maxY]}
          />
          <VictoryAxis
            tickValues={hours}
            style={{
              axis: { stroke: '#1F2937', strokeWidth: 1 },
              ticks: { stroke: 'transparent' },
              tickLabels: { fill: TICK, fontSize: 12, padding: 8 },
            }}
          />
          <VictoryGroup offset={18}>
            <VictoryBar
              data={callsSeries}
              barWidth={BAR_WIDTH}
              cornerRadius={{ top: 4 }}
              style={{ data: { fill: GREEN } }}
            />
            <VictoryBar
              data={msgsSeries}
              barWidth={BAR_WIDTH}
              cornerRadius={{ top: 4 }}
              style={{ data: { fill: BLUE } }}
            />
          </VictoryGroup>
        </VictoryChart>
      </ScrollView>
    </View>
  );
}
