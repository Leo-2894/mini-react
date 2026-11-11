import { h } from './mini-react/vnode.js';
import { useEffect, useMemo, useState } from './mini-react/hooks.js';
import type { AttrInput, Child } from './mini-react/types.js';

type Lesson = 'state' | 'effect' | 'memo';
type Channel = 'A' | 'B';
type Calculation = Readonly<{ total: number }>;

const signals = new EventTarget();
const unitPrice = 1000;

const lessons: ReadonlyArray<{ id: Lesson; hook: string; title: string }> = [
  { id: 'state', hook: 'useState', title: '값 기억하기' },
  { id: 'effect', hook: 'useEffect', title: '신호 듣고 정리하기' },
  { id: 'memo', hook: 'useMemo', title: '계산 결과 다시 쓰기' }
];

function button(label: string, onClick: () => void, attrs: AttrInput = {}) {
  return h('button', { attrs: { type: 'button', ...attrs }, events: { click: onClick } }, label);
}

function observation(label: string, value: Child, id: string, description: string) {
  return h('div', { attrs: { class: 'observation' } },
    h('p', { attrs: { class: 'output-label' } }, label),
    h('output', { attrs: { 'aria-label': label, 'data-testid': id } }, value),
    h('p', { attrs: { class: 'output-description' } }, description));
}

function explanation(steps: readonly string[], code: string) {
  return h('aside', { attrs: { class: 'explanation', 'aria-label': '동작 설명' } },
    h('h3', {}, '어떤 코드가 실행되나요?'),
    h('ol', {}, steps.map((step, index) => h('li', { key: index }, step))),
    h('pre', {}, h('code', {}, code)));
}

function exercise(id: Lesson, title: string, hint: string, controls: Child, notes: Child) {
  return h('section', { key: id, attrs: { class: 'exercise', 'aria-labelledby': 'exercise-heading' } },
    h('div', { attrs: { class: 'exercise-header' } },
      h('p', { attrs: { class: 'eyebrow' } }, lessons.find(lesson => lesson.id === id)?.hook ?? ''),
      h('h2', { attrs: { id: 'exercise-heading' } }, title),
      h('p', {}, hint)),
    h('div', { attrs: { class: 'exercise-grid' } }, controls, notes));
}

interface StateProps {
  count: number;
  note: string;
  onNote: (note: string) => void;
  onIncrement: () => void;
  onBatch: () => void;
  onReset: () => void;
}

function StateLab({ count, note, onNote, onIncrement, onBatch, onReset }: StateProps) {
  return exercise('state', '버튼을 누르면 숫자가 바뀝니다',
    '메모를 입력하고 +3 묶기를 눌러 보세요. 숫자가 3 늘고 메모는 그대로 남습니다.',
    h('div', { attrs: { class: 'controls' } },
      observation('현재 숫자', count, 'count', 'App이 기억한 count를 자식에게 전달합니다.'),
      h('div', { attrs: { class: 'actions' } },
        button('+1', onIncrement),
        button('+3 묶기', onBatch, { class: 'primary' }),
        button('숫자 초기화', onReset)),
      h('label', { attrs: { class: 'field' } }, '실습 메모',
        h('input', { key: 'note', attrs: { type: 'text', placeholder: '예: 숫자와 별도로 기억되는 값', maxlength: 80 },
          props: { value: note }, events: { input: event => {
            if (event.target instanceof HTMLInputElement) onNote(event.target.value);
          } } }))),
    explanation([
      'App의 useState가 숫자와 메모를 각각 기억합니다. 자식은 props로 받은 값을 보여 줍니다.',
      '+3 버튼은 이전 값에 1을 더하는 함수를 세 번 예약합니다. 같은 클릭 안의 요청을 모아 한 번 갱신합니다.',
      'FunctionComponent의 hooks 배열에서 같은 호출 순서로 값을 찾아 다음 화면을 만듭니다.'
    ], 'setCount(n => n + 1)\nsetCount(n => n + 1)\nsetCount(n => n + 1)'));
}

interface EffectProps {
  enabled: boolean;
  channel: Channel;
  received: number;
  onToggle: () => void;
  onChannel: (channel: Channel) => void;
  onSignal: (channel: Channel) => void;
}

function EffectLab({ enabled, channel, received, onToggle, onChannel, onSignal }: EffectProps) {
  return exercise('effect', '지금 구독한 신호만 받습니다',
    'A를 구독하고 A·B 신호를 보내세요. B로 바꿔 보내거나 구독을 멈추면 어떤 신호가 들어오는지 비교할 수 있습니다.',
    h('div', { attrs: { class: 'controls' } },
      observation('받은 신호', received, 'received', enabled ? channel + ' 신호 구독 중' : '구독을 시작하면 선택한 신호를 받습니다.'),
      h('div', { attrs: { class: 'actions', role: 'group', 'aria-label': '구독 채널' } },
        button('채널 A', () => onChannel('A'), { 'aria-pressed': channel === 'A' ? 'true' : 'false' }),
        button('채널 B', () => onChannel('B'), { 'aria-pressed': channel === 'B' ? 'true' : 'false' }),
        button(enabled ? '구독 멈추기' : '구독 시작', onToggle, { class: 'primary' })),
      h('div', { attrs: { class: 'actions', role: 'group', 'aria-label': '브라우저 신호 보내기' } },
        button('A 신호 보내기', () => onSignal('A')),
        button('B 신호 보내기', () => onSignal('B')))),
    explanation([
      '화면 반영 뒤 useEffect가 선택한 채널의 이벤트를 듣기 시작합니다.',
      '채널을 바꾸거나 구독을 멈추면 cleanup이 이전 이벤트 연결을 제거합니다.',
      '신호를 받아 숫자가 변해도 채널과 구독 상태가 같으면 연결을 유지합니다.'
    ], 'useEffect(() => {\n  if (!subscribed) return\n  signals.addEventListener(channel, receive)\n  return () => signals.removeEventListener(channel, receive)\n}, [subscribed, channel])'));
}

interface MemoProps {
  quantity: number;
  result: Calculation;
  saved: Calculation | null;
  alternate: boolean;
  onQuantity: () => void;
  onView: () => void;
  onSave: () => void;
}

function MemoLab({ quantity, result, saved, alternate, onQuantity, onView, onSave }: MemoProps) {
  const comparison = saved === null ? '비교 기준 없음' : saved === result ? '같은 결과 재사용' : '새 결과 계산';
  return exercise('memo', '수량이 같으면 계산 결과를 다시 씁니다',
    '기준 저장 → 보기 전환 → 수량 +1 순서로 눌러 보세요. 기준과 같은 결과 객체인지 확인합니다.',
    h('div', { attrs: { class: 'controls' } },
      observation('계산 결과', result.total.toLocaleString('ko-KR') + '원', 'total',
        '1,000원 × ' + quantity + '개 · 보기 ' + (alternate ? 'B' : 'A')),
      h('div', { attrs: { class: 'actions' } },
        button('기준 저장', onSave, { class: 'primary' }),
        button('보기 전환', onView),
        button('수량 +1', onQuantity)),
      h('p', { attrs: { class: 'memo-result', role: 'status', 'data-testid': 'memo-comparison' } }, comparison)),
    explanation([
      '기준 저장은 지금의 결과 객체를 기억합니다.',
      '보기만 바꾸면 App은 다시 실행되지만 수량은 그대로라 같은 결과 객체를 씁니다.',
      '수량이 바뀌면 useMemo가 새 객체를 계산합니다. 화면은 저장한 객체와 현재 객체를 ===로 비교합니다.'
    ], 'useMemo(\n  () => ({ total: unitPrice * quantity }),\n  [quantity]\n)'));
}

export function App() {
  const [lesson, setLesson] = useState<Lesson>('state');
  const [count, setCount] = useState(0);
  const [note, setNote] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [channel, setChannel] = useState<Channel>('A');
  const [received, setReceived] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState<Calculation | null>(null);
  const [alternate, setAlternate] = useState(false);

  const result = useMemo<Calculation>(() => ({ total: unitPrice * quantity }), [quantity]);
  const subscribed = lesson === 'effect' && enabled;
  useEffect(() => {
    if (!subscribed) return;
    const receive = () => setReceived(value => value + 1);
    signals.addEventListener(channel, receive);
    return () => signals.removeEventListener(channel, receive);
  }, [subscribed, channel]);

  const increment = () => setCount(value => value + 1);
  const panel = lesson === 'state'
    ? h(StateLab, { count, note, onNote: setNote, onIncrement: increment, onBatch: () => {
      increment();
      increment();
      increment();
    }, onReset: () => setCount(0) })
    : lesson === 'effect'
      ? h(EffectLab, { enabled, channel, received, onToggle: () => setEnabled(value => !value), onChannel: setChannel,
        onSignal: value => { signals.dispatchEvent(new Event(value)); } })
      : h(MemoLab, { quantity, result, saved, alternate, onQuantity: () => setQuantity(value => value + 1),
        onView: () => setAlternate(value => !value), onSave: () => setSaved(result) });

  return h('div', { attrs: { class: 'lab-page' } },
    h('header', { attrs: { class: 'site-header' } },
      h('div', { attrs: { class: 'site-width header-inner' } },
        h('a', { attrs: { class: 'brand', href: './' } }, 'Mini React Lab'),
        h('nav', { attrs: { 'aria-label': '학습 페이지' } },
          h('a', { attrs: { href: './phase1/' } }, 'Phase 1 DOM Lab'),
          h('a', { attrs: { href: './', 'aria-current': 'page' } }, 'Phase 2 Hook Lab'),
          h('a', { attrs: { href: './learning/mini-react-flow.html' } }, '개념 흐름도')))),
    h('main', { attrs: { class: 'site-width' } },
      h('div', { attrs: { class: 'intro' } },
        h('p', { attrs: { class: 'eyebrow' } }, 'Phase 2 · Hook Lab'),
        h('h1', {}, '버튼을 눌러 Hook을 배워요'),
        h('p', {}, '입력한 값은 어디에 남을까요? 화면을 바꾸고 결과를 비교하며 State와 Hook의 역할을 확인하세요.')),
      h('div', { attrs: { class: 'lesson-picker', role: 'group', 'aria-label': 'Hook 실습 선택' } },
        lessons.map(item => h('button', { key: item.id, attrs: { type: 'button', 'aria-pressed': item.id === lesson ? 'true' : 'false' },
          events: { click: () => setLesson(item.id) } },
          h('strong', {}, item.hook), h('span', {}, item.title)))),
      panel,
      h('section', { attrs: { class: 'shared-flow', 'aria-label': '공용 화면 갱신 흐름' } },
        h('p', {}, '상태가 바뀌면 App이 새 Virtual DOM을 만들고, DOM Lab과 같은 Diff/Patch가 화면에 반영합니다.'),
        h('a', { attrs: { href: './learning/mini-react-flow.html' } }, 'Phase 1과 2 연결 보기'))));
}
