// ActivityChartCard.js
import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Dimensions, ScrollView} from 'react-native';
import {BarChart} from 'react-native-gifted-charts';

const GREEN = '#3EBF0F';
const BLUE  = '#115BC7';

const defaultHours = ['8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM'];

export default function ActivityChartCard({
  hours = defaultHours,
  calls = [15,28,72,58,30,12,18,22,35,20,14,10],
  messages = [10,22,50,60,25,55,38,40,45,28,20,12],
  title = 'Activity Breakdown',
}) {
  const SCREEN_WIDTH = Dimensions.get('window').width;

  // Layout – align with your page container (you already have padding outside)
  const CARD_HPAD = 0;

  // Visuals to match Figma
  const BAR_WIDTH = 12;          // single bar width
  const GROUP_SPACING = 16;      // gap between hour groups
  const LEFT_PAD  = 36;          // room for Y labels
  const RIGHT_PAD = 16;
  const CHART_HEIGHT = 180;

  // Build grouped dataset (label is centered between the two bars automatically)
  const barGroups = useMemo(
    () => hours.map((label, i) => ({
      label,
      bars: [
        { value: calls[i] ?? 0, frontColor: GREEN },
        { value: messages[i] ?? 0, frontColor: BLUE },
      ],
    })),
    [hours, calls, messages]
  );

  // Make the INNER canvas wider than the card so only the plot scrolls
  const groups = barGroups.length;
  const contentWidth = LEFT_PAD + RIGHT_PAD + groups * (BAR_WIDTH * 2 + GROUP_SPACING) + 8; // small fudge

  return (
    <View style={[styles.card, { marginHorizontal: CARD_HPAD }]}>
      {/* ----- STATIC header (does NOT scroll) ----- */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.legendRow}>
          <LegendDot color={GREEN} label="Calls" />
          <LegendDot color={BLUE}  label="Messages" />
        </View>
      </View>

      {/* ----- Only the chart scrolls ----- */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ width: Math.max(contentWidth, SCREEN_WIDTH - CARD_HPAD * 2) }}
      >
        <BarChart
          barGroups={barGroups}
          width={Math.max(contentWidth, SCREEN_WIDTH - CARD_HPAD * 2)}
          height={CHART_HEIGHT}

          // spacing & sizing
          barWidth={BAR_WIDTH}
          spacing={GROUP_SPACING}
          initialSpacing={LEFT_PAD}
          endSpacing={RIGHT_PAD}

          // axes
          yAxisLabelTexts={['0','25','50','75','100']}
          maxValue={100}
          noOfSections={4}
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

          // look
          isAnimated
          animationDuration={400}
          backgroundColor="transparent"
          showVerticalLines={false}
          showValuesAsTopLabel={false}
        />
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
    overflow: 'hidden',
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
