// ActivityChartCard.js
import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Dimensions, ScrollView} from 'react-native';
import {BarChart} from 'react-native-gifted-charts';

const GREEN = '#3EBF0F'; // Calls
const BLUE  = '#115BC7'; // Messages

const defaultHours = [
  '8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM',
];

export default function ActivityChartCard({
  hours = defaultHours,
  calls = [15, 28, 72, 58, 30, 12, 18, 22, 35, 20, 14, 10],
  messages = [10, 22, 50, 60, 25, 55, 38, 40, 45, 28, 20, 12],
  title = 'Activity Breakdown',
}) {
  const SCREEN_WIDTH = Dimensions.get('window').width;

  // match the page's horizontal padding so the card lines up with the tiles
  const PAGE_PAD = 10;

  // visual tuning to match Figma
  const BAR_WIDTH = 12;        // slightly slimmer bars
  const INTRA_GAP = 6;         // small gap between Calls & Messages (tight group)
  const GROUP_GAP = 20;        // gap to next hour group
  const LEFT_PAD  = 36;        // space for y-axis + first grid
  const RIGHT_PAD = 16;
  const CHART_HEIGHT = 180;

  // ---------- build flat data (2 bars + a transparent "label carrier" per hour) ----------
  // We put a tiny transparent bar between the two bars and place the hour label on it.
  // That visually centers the label between the pair even on old library versions.
  const data = useMemo(() => {
    const rows = [];
    for (let i = 0; i < hours.length; i++) {
      // add group gap before every group except the very first one
      if (i > 0) rows.push({value: 0, spacing: GROUP_GAP, frontColor: 'transparent'});

      // Calls
      rows.push({
        value: calls[i] ?? 0,
        frontColor: GREEN,
        barWidth: BAR_WIDTH,
        spacing: 0, // no space before the first bar in the pair
      });

      // label carrier (almost invisible bar) sits between the pair
      rows.push({
        value: 0,
        frontColor: 'transparent',
        barWidth: 2,              // keep it very thin
        spacing: INTRA_GAP / 2,   // half gap before, half gap after total = INTRA_GAP
        label: hours[i],
        labelTextStyle: styles.xAxisText,
      });

      // Messages
      rows.push({
        value: messages[i] ?? 0,
        frontColor: BLUE,
        barWidth: BAR_WIDTH,
        spacing: INTRA_GAP / 2,   // completes the intra gap
      });
    }
    return rows;
  }, [hours, calls, messages]);

  // y-axis ticks 0/25/50/75/100
  const yAxisLabelTexts = ['0', '25', '50', '75', '100'];
  const MAX_VALUE = 100;

  // visible width of the card’s chart area (keeps card aligned with page)
  const visibleWidth = SCREEN_WIDTH - PAGE_PAD * 2;

  // compute total content width so the inner chart can scroll
  // Each hour contributes: (BAR_WIDTH + thinCarrier(2) + BAR_WIDTH) + INTRA_GAP + GROUP_GAP (except last)
  const perGroup = (BAR_WIDTH + 2 + BAR_WIDTH) + INTRA_GAP;
  const contentWidth =
    LEFT_PAD + RIGHT_PAD +
    hours.length * perGroup + (hours.length - 1) * GROUP_GAP;

  return (
    <View style={[styles.card, {marginHorizontal: PAGE_PAD}]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.legendRow}>
          <LegendDot color={GREEN} label="Calls" />
          <LegendDot color={BLUE}  label="Messages" />
        </View>
      </View>

      {/* Scrollable plot — content wider than viewport; card clips overflow */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{width: Math.max(contentWidth, visibleWidth)}}
      >
        <View style={{width: Math.max(contentWidth, visibleWidth)}}>
          <BarChart
            data={data}
            width={Math.max(contentWidth, visibleWidth)}
            height={CHART_HEIGHT}

            // axes + grid
            yAxisLabelTexts={yAxisLabelTexts}
            maxValue={MAX_VALUE}
            noOfSections={yAxisLabelTexts.length - 1}
            yAxisThickness={1}
            xAxisThickness={1}
            yAxisLabelWidth={28}
            xAxisLabelsHeight={24}
            yAxisTextStyle={styles.yAxisText}
            xAxisLabelTextStyle={styles.xAxisText}
            yAxisColor="#E8EEF5"
            xAxisColor="#E8EEF5"
            rulesColor="#E8EEF5"
            hideRules={false}

            // look & feel
            isAnimated
            animationDuration={500}
            backgroundColor="transparent"
            showVerticalLines={false}
            showValuesAsTopLabel={false}

            // paddings so first grid + bars align nicely
            initialSpacing={LEFT_PAD}
            endSpacing={RIGHT_PAD}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function LegendDot({color, label}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, {backgroundColor: color}]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingTop: 14,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#DFE1E6',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
    overflow: 'hidden', // <- prevents bars from drawing outside the card
  },
  headerRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#1B2430' },
  legendRow: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 6 },
  legendText: { fontSize: 12, color: '#6B7A90', fontWeight: '500' },
  yAxisText: { fontSize: 10, color: '#6B7A90' },
  xAxisText: { fontSize: 10, color: '#6B7A90' },
});

