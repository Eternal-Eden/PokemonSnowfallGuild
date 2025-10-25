/**
 * 测试性格修正显示功能
 */

import { NATURE_MODIFIERS } from '../lib/pokemonDamageCalculator';

console.log('=== 性格修正显示功能测试 ===\n');

// 测试几个不同的性格
const testNatures = ['怕寂寞', '固执', '勤奋', '胆小', '温和'];

testNatures.forEach(nature => {
  console.log(`性格: ${nature}`);
  
  if (NATURE_MODIFIERS[nature]) {
    const modifier = NATURE_MODIFIERS[nature];
    
    Object.entries(modifier).forEach(([stat, value]) => {
      if (stat === 'name') return; // 跳过name字段
      
      let status = '';
      if (value > 1.0) {
        status = '↑ (增加)';
      } else if (value < 1.0) {
        status = '↓ (减少)';
      } else {
        status = '- (无变化)';
      }
      
      console.log(`  ${stat}: ×${value} ${status}`);
    });
  } else {
    console.log('  未找到该性格的修正数据');
  }
  
  console.log('');
});

console.log('测试完成！');