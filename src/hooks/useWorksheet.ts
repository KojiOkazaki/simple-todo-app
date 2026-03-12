import { useState } from 'react';
import type { LifelineItem, StrengthsData, GakuchikaData, ValuesData } from '../lib/constants';

export function useWorksheet() {
  const [lifelineData, setLifelineData] = useState<LifelineItem[]>([
    { id: 'es', period: '小学生', score: 0, event: '', reason: '' },
    { id: 'jhs', period: '中学生', score: 0, event: '', reason: '' },
    { id: 'hs', period: '高校生', score: 0, event: '', reason: '' },
    { id: 'uni', period: '大学生', score: 0, event: '', reason: '' },
  ]);

  const [strengthsData, setStrengthsData] = useState<StrengthsData>({
    selectedStrengths: [],
    episode: '',
    prText: '',
  });

  const [gakuchikaData, setGakuchikaData] = useState<GakuchikaData>({
    title: '',
    detail: '',
    difficulty: '',
    overcoming: '',
  });

  const [valuesData, setValuesData] = useState<ValuesData>({
    selectedValues: [],
    criteria: '',
    future: '',
    coreValue: '',
  });

  const handleLifelineChange = (id: string, field: string, value: string) => {
    setLifelineData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'score' ? parseInt(value) || 0 : value }
          : item
      )
    );
  };

  const handleGakuchikaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGakuchikaData((prev) => ({ ...prev, [name]: value }));
  };

  const handleValuesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValuesData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStrengthToggle = (strength: string) => {
    setStrengthsData((prev) => {
      const isSelected = prev.selectedStrengths.includes(strength);
      if (isSelected) {
        return { ...prev, selectedStrengths: prev.selectedStrengths.filter((s) => s !== strength) };
      }
      if (prev.selectedStrengths.length >= 3) {
        alert('強みは最大3つまで選択してください。');
        return prev;
      }
      return { ...prev, selectedStrengths: [...prev.selectedStrengths, strength] };
    });
  };

  const handleValueToggle = (val: string) => {
    setValuesData((prev) => {
      const isSelected = prev.selectedValues.includes(val);
      if (isSelected) {
        return { ...prev, selectedValues: prev.selectedValues.filter((v) => v !== val) };
      }
      if (prev.selectedValues.length >= 5) {
        alert('価値観は最大5つまで選択してください。');
        return prev;
      }
      return { ...prev, selectedValues: [...prev.selectedValues, val] };
    });
  };

  return {
    lifelineData,
    strengthsData,
    setStrengthsData,
    gakuchikaData,
    valuesData,
    handleLifelineChange,
    handleGakuchikaChange,
    handleValuesChange,
    handleStrengthToggle,
    handleValueToggle,
  };
}
