import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

const GREEN = '#3EBF0F';   // Calls
const BLUE  = '#115BC7';   // Messages

export function ActivityChartBlock() {
  // ----- dummy data -----
  const hours     = ['8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM'];
  const calls     = [15, 28, 72, 58, 30, 12, 18, 22, 35, 20];
  const messages  = [10, 22, 50, 60, 25, 55, 38, 40, 45, 28];

  const barGroups = hours.map((label, i) => ({
    label,
    bars: [
      { value: calls[i],    frontColor: GREEN },
      { value: messages[i], frontColor: BLUE  },
    ],
  }));

  // ----- sizing so it actually scrolls -----
  const chartPaddingH  = 16;   // inner padding for the chart area
  const groupVisualW   = 50;   // width allocated per label (pair of bars + gaps)
  const minVisibleCols = 6;    // ~labels visible before horizontal scroll
  const contentWidth   = Math.max(
    minVisibleCols * groupVisualW + chartPaddingH * 2,
    hours.length   * groupVisualW + chartPaddingH * 2
  );

  // ----- external scroll indicator (outside the card) -----
  const [trackW, setTrackW]       = useState(0);
  const [thumbW, setThumbW]       = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [viewportW, setViewportW] = useState(0);

  const recalcThumbAtStart = () => {
    if (!viewportW || !trackW) return;
    const visible = viewportW;
    const track   = trackW;
    const thumb   = Math.max((visible / contentWidth) * track, 24); // min thumb width
    setThumbW(thumb);
    setThumbLeft(0);
  };

  useEffect(() => {
    recalcThumbAtStart();
  }, [viewportW, trackW, contentWidth]);

  const onScroll = (e) => {
    const x         = e.nativeEvent.contentOffset.x;
    const visible   = viewportW || 1;
    const scrollMax = Math.max(contentWidth - visible, 1);
    const track     = trackW || 1;
    const thumb     = Math.max((visible / contentWidth) * track, 24);
    const left      = (x / scrollMax) * (track - thumb);
    setThumbW(thumb);
    setThumbLeft(Math.max(0, Math.min(left, track - thumb)));
  };

  return (
    <>
      {/* CARD */}
      <View style={styles.chartCard}>
        {/* header */}
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Activity Breakdown</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
            <Text style={styles.legendText}>Calls</Text>
            <View style={{ width: 12 }} />
            <View style={[styles.legendDot, { backgroundColor: BLUE }]} />
            <Text style={styles.legendText}>Messages</Text>
          </View>
        </View>
        <View style={styles.headerDivider} />

        {/* scrollable chart */}
        <ScrollView
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: chartPaddingH, width: contentWidth }}
          onLayout={e => setViewportW(e.nativeEvent.layout.width)}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <BarChart
            // width must exclude the padding added above
            width={contentWidth - chartPaddingH * 2}
            height={180}
            barWidth={16}
            spacing={28}
            barBorderRadius={4}
            barGroups={barGroups}

            // Axis & dashed grid like Figma
            maxValue={100}
            noOfSections={4}                     // 0,25,50,75,100
            yAxisLabelWidth={26}                 // flush-left, no weird gap
            yAxisTextStyle={{ color: '#6B7280', fontSize: 10 }}
            yAxisThickness={0}
            xAxisThickness={0}
            xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 10, marginTop: 4 }}
            xAxisLabelVerticalShift={4}
            rulesColor="#E5E7EB"
            rulesType="dashed"
            dashWidth={3}
            dashGap={4}

            // visuals
            isAnimated
            animationDuration={600}
            backgroundColor="transparent"
            initialSpacing={8}
          />
        </ScrollView>
      </View>

      {/* SCROLL INDICATOR — OUTSIDE the card */}
      <View
        style={styles.scrollIndicatorTrack}
        onLayout={e => setTrackW(e.nativeEvent.layout.width)}
      >
        <View style={[styles.scrollIndicatorThumb, { width: thumbW, left: thumbLeft }]} />
      </View>
    </>
  );
}

export default ActivityChartBlock;

const styles = StyleSheet.create({
  chartCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE1E6',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 8, // small gap so the outside track sits close
  },
  chartHeader: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#111827', fontWeight: '600' },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  // Indicator OUTSIDE the card
  // If your page horizontal padding ≠ 20, adjust the marginHorizontal accordingly.
  scrollIndicatorTrack: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 16,
    marginHorizontal: 36, // chart inner 16 + page padding 20
    position: 'relative',
    overflow: 'hidden',
  },
  scrollIndicatorThumb: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#3EBF0F',
    borderRadius: 2,
  },
});
