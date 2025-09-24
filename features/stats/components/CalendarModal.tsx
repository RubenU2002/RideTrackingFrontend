import { ThemedText } from '@/components/ThemedText';
import {
  Box,
  Button,
  ButtonText,
  Pressable,
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from '@gluestack-ui/themed';
import React from 'react';
import { Modal } from 'react-native';

export type CalendarModalProps = {
  visible: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (iso: string) => void;
};

export function CalendarModal({ visible, onClose, selected, onSelect }: CalendarModalProps) {
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
  const years = Array.from({ length: 11 }, (_, i) => y - 5 + i);

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
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Pressable
                accessibilityLabel="Mes anterior"
                onPress={() => changeMonth(-1)}
                px="$2"
                py="$1"
              >
                <ThemedText>{'‹'}</ThemedText>
              </Pressable>
              <Box flexDirection="row" alignItems="center" gap={8}>
                <Select
                  selectedValue={String(m)}
                  onValueChange={(val: string) => setM(parseInt(val, 10))}
                >
                  <SelectTrigger variant="outline" size="sm">
                    <SelectInput placeholder="Mes" value={months[m]} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {months.map((mm, idx) => (
                        <SelectItem key={mm} label={mm} value={String(idx)} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
                <Select
                  selectedValue={String(y)}
                  onValueChange={(val: string) => setY(parseInt(val, 10))}
                >
                  <SelectTrigger variant="outline" size="sm">
                    <SelectInput placeholder="Año" value={String(y)} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {years.map((yy) => (
                        <SelectItem key={yy} label={String(yy)} value={String(yy)} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </Box>
              <Pressable
                accessibilityLabel="Mes siguiente"
                onPress={() => changeMonth(1)}
                px="$2"
                py="$1"
              >
                <ThemedText>{'›'}</ThemedText>
              </Pressable>
            </Box>
            <WeekHeader />
            <Box flexDirection="row" flexWrap="wrap" style={{ gap: 6 }}>
              {weeks.map((d, i) =>
                d === null ? (
                  <Box key={`ph-${i}`} style={{ width: '13.1%', aspectRatio: 1 }} />
                ) : (
                  <Pressable
                    key={d.toISOString()}
                    onPress={() => {
                      onSelect(d.toISOString().slice(0, 10));
                      onClose();
                    }}
                    style={{
                      width: '13.1%',
                      aspectRatio: 1,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: d.toISOString().slice(0, 10) === selected ? 2 : 1,
                      borderColor:
                        d.toISOString().slice(0, 10) === selected
                          ? '#4f7afe'
                          : 'rgba(125,125,125,0.2)',
                    }}
                  >
                    <ThemedText style={{ fontWeight: '700', fontSize: 12 }}>
                      {d.getDate()}
                    </ThemedText>
                  </Pressable>
                ),
              )}
            </Box>
            <Box alignItems="flex-end">
              <Button size="sm" variant="outline" onPress={onClose}>
                <ButtonText>Cerrar</ButtonText>
              </Button>
            </Box>
          </Box>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function WeekHeader() {
  const weekHeaders = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return (
    <Box flexDirection="row" justifyContent="space-between">
      {weekHeaders.map((d) => (
        <ThemedText
          key={`wd-${d}`}
          style={{ width: '13.1%', textAlign: 'center', fontSize: 10, opacity: 0.5 }}
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
  for (let i = 0; i < startWeekday; i++) {cells.push(null);}
  for (let d = 1; d <= daysInMonth; d++) {cells.push(new Date(year, month, d));}
  return cells;
}
