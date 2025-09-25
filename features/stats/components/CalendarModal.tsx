import { ThemedText } from '@/components/ThemedText';
import { Colors, Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getTodayInColombia } from '@/core/utils/timezone';
import { Box, Button, ButtonText, Pressable } from '@gluestack-ui/themed';
import React from 'react';
import { Modal } from 'react-native';

export type CalendarModalProps = {
  visible: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (iso: string) => void;
};

export function CalendarModal({ visible, onClose, selected, onSelect }: CalendarModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const accent = Colors[colorScheme].tint;
  const selectedBg = accent + (colorScheme === 'dark' ? '33' : '22'); // stronger alpha en dark
  const selDate = new Date(selected + 'T00:00:00');
  const [y, setY] = React.useState(selDate.getFullYear());
  const [m, setM] = React.useState(selDate.getMonth());

  React.useEffect(() => {
    const d = new Date(selected + 'T00:00:00');
    setY(d.getFullYear());
    setM(d.getMonth());
  }, [selected]);

  const weeks = buildMonthGrid(y, m);
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const changeMonth = (delta: number) => {
    const d = new Date(y, m + delta, 1);
    setY(d.getFullYear());
    setM(d.getMonth());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable flex={1} onPress={onClose} bg="rgba(0,0,0,0.55)" justifyContent="flex-end" p="$4">
        <Pressable onPress={(e: any) => e.stopPropagation()} w="$full">
          <Box
            bg="$backgroundLight0"
            sx={{ _dark: { bg: '$backgroundDark950' } }}
            borderRadius={18}
            p="$4"
            maxHeight="85%"
            alignSelf="flex-end"
            gap={10}
          >
            <Header
              monthLabel={`${months[m]} ${y}`}
              onPrev={() => changeMonth(-1)}
              onNext={() => changeMonth(1)}
              onToday={() => {
                const iso = getTodayInColombia();
                const d = new Date(iso + 'T00:00:00');
                setY(d.getFullYear());
                setM(d.getMonth());
                onSelect(iso);
                onClose();
              }}
            />
            <WeekHeader />
            <Box flexDirection="row" flexWrap="wrap" style={{ gap: 6 }}>
              {weeks.map((d, i) => {
                if (d === null) {
                  return <Box key={`ph-${i}`} style={{ width: '13.1%', aspectRatio: 1 }} />;
                }
                const iso = d.toISOString().slice(0, 10);
                const isSelected = iso === selected;
                const txtLight = isSelected ? accent : Colors.light.text;
                const txtDark = isSelected ? accent : Colors.dark.text;
                return (
                  <Pressable
                    key={iso}
                    onPress={() => {
                      onSelect(iso);
                      onClose();
                    }}
                    style={{
                      width: '13.1%',
                      aspectRatio: 1,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      backgroundColor: isSelected ? selectedBg : undefined,
                    }}
                    sx={{
                      _light: { borderColor: '$borderLight200' },
                      _dark: { borderColor: '$borderDark700' },
                    }}
                  >
                    <ThemedText
                      lightColor={txtLight}
                      darkColor={txtDark}
                      style={{ fontWeight: '700', fontSize: 12 }}
                    >
                      {d.getDate()}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </Box>
          </Box>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function WeekHeader() {
  const scheme = useColorScheme() ?? 'light';
  const muted = scheme === 'dark' ? Palette.dark.muted : Palette.light.muted;
  const weekHeaders = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return (
    <Box flexDirection="row" justifyContent="space-between">
      {weekHeaders.map((d) => (
        <ThemedText
          key={`wd-${d}`}
          lightColor={muted}
          darkColor={muted}
          style={{ width: '13.1%', textAlign: 'center', fontSize: 10 }}
        >
          {d}
        </ThemedText>
      ))}
    </Box>
  );
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  // Relleno hasta completar filas (múltiplos de 7) para cuadrícula estable
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function Header({
  monthLabel,
  onPrev,
  onNext,
  onToday,
}: {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
      <Pressable accessibilityLabel="Mes anterior" onPress={onPrev} px="$2" py="$1">
        <ThemedText>{'‹'}</ThemedText>
      </Pressable>
      <Box flexDirection="row" alignItems="center" gap={10}>
        <ThemedText type="title" style={{ fontSize: 16 }}>
          {monthLabel}
        </ThemedText>
        <Button size="xs" variant="outline" onPress={onToday}>
          <ButtonText>Hoy</ButtonText>
        </Button>
      </Box>
      <Pressable accessibilityLabel="Mes siguiente" onPress={onNext} px="$2" py="$1">
        <ThemedText>{'›'}</ThemedText>
      </Pressable>
    </Box>
  );
}
