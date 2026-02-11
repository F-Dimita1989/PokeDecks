import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConfidenceBarProps {
  /** Value between 0 and 1 */
  confidence: number;
  label?: string;
}

export function ConfidenceBar({
  confidence,
  label = 'Confidence',
}: ConfidenceBarProps) {
  const percent = Math.round(confidence * 100);

  const barColor =
    confidence >= 0.7
      ? '#2ECC71' // green
      : confidence >= 0.4
        ? '#F39C12' // orange
        : '#E74C3C'; // red

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.percent, { color: barColor }]}>{percent}%</Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${percent}%` as `${number}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '500',
  },
  percent: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
