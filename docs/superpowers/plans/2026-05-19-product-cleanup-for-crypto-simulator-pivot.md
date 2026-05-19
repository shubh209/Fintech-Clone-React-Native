# Product Cleanup For Crypto Simulator Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove misleading fintech-clone UI/actions so remaining app surface is honest, testable, and ready for crypto simulator work.

**Architecture:** Keep backend, auth provider, crypto market screens, transaction store, and Activity for now. Remove only visible fake controls, static finance widgets, and unused UI components. Add regression tests that guard against reintroducing misleading labels/actions.

**Tech Stack:** Expo Router, React Native, TypeScript, Jest, `rg`, existing file-based regression tests.

---

## File Structure

- Modify `apps/frontend/app/(authenticated)/(tabs)/home.tsx`: remove random `Add Money`, destructive `Exchange`, `More`, and widgets section; keep balance summary, Details, recent activity.
- Delete `apps/frontend/Components/ui/DropDown.tsx`: no remaining useful menu behavior.
- Modify `apps/frontend/Components/layout/CustomHeader.tsx`: simplify to static section title and optional real account button only if navigation exists; otherwise remove fake controls.
- Delete `apps/frontend/Components/sortable-list/WidgetList.tsx`: widget section removed from Home.
- Delete `apps/frontend/Components/sortable-list/Tile.tsx`: only used by `WidgetList`.
- Keep other sortable-list infra only if still imported; otherwise leave untouched to avoid broad cleanup.
- Modify `apps/frontend/app/login.tsx`: remove unimplemented email/Google/Apple buttons; keep phone flow.
- Modify `apps/frontend/app/(authenticated)/(modals)/account.tsx`: remove fake Account/Learn/Inbox rows; keep signout/profile/icon behavior.
- Modify `apps/frontend/__tests__/home-ui-regressions.test.ts`: assert misleading Home controls/menu labels are absent.
- Create `apps/frontend/__tests__/product-cleanup-regressions.test.ts`: source-level checks for fake auth/account/widget labels.

## Task 1: Guard Home Cleanup

**Files:**
- Modify: `apps/frontend/__tests__/home-ui-regressions.test.ts`

- [ ] **Step 1: Replace old Home regression checks**

Use source-text tests because current project already uses this pattern.

```ts
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');

const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('home product cleanup regressions', () => {
  it('does not expose random or destructive money actions', () => {
    const source = read('app/(authenticated)/(tabs)/home.tsx');

    expect(source).not.toContain("text={'Add Money'}");
    expect(source).not.toContain("text={'Exchange'}");
    expect(source).not.toContain('Math.random');
    expect(source).not.toContain('clearTansactions');
  });

  it('does not render the fake More menu or static widgets', () => {
    const source = read('app/(authenticated)/(tabs)/home.tsx');

    expect(source).not.toContain('<DropDown');
    expect(source).not.toContain('<WidgetList');
    expect(source).not.toContain('Widgets');
  });

  it('keeps Details wired to Activity', () => {
    const source = read('app/(authenticated)/(tabs)/home.tsx');

    expect(source).toContain("text={'Details'}");
    expect(source).toContain("router.push('/(authenticated)/(tabs)/activity'");
  });
});
```

- [ ] **Step 2: Run test red**

Run:

```bash
npx jest --runTestsByPath apps/frontend/__tests__/home-ui-regressions.test.ts --runInBand --watchman=false
```

Expected: FAIL because Home still contains `Add Money`, `Exchange`, `DropDown`, `WidgetList`, and `Math.random`.

## Task 2: Clean Home Screen

**Files:**
- Modify: `apps/frontend/app/(authenticated)/(tabs)/home.tsx`
- Delete: `apps/frontend/Components/ui/DropDown.tsx`
- Delete: `apps/frontend/Components/sortable-list/WidgetList.tsx`
- Delete: `apps/frontend/Components/sortable-list/Tile.tsx`

- [ ] **Step 1: Remove fake imports**

Remove these imports from Home:

```ts
import DropDown from '@/Components/ui/DropDown';
import WidgetList from '@/Components/sortable-list/WidgetList';
```

- [ ] **Step 2: Remove fake actions**

Remove `runTransaction` and `clearTansactions` from store destructuring.

Before:

```ts
const {balance, runTransaction, clearTansactions, transactions, syncStatus} = useBalanceStore();
```

After:

```ts
const { balance, transactions, syncStatus } = useBalanceStore();
```

Delete `onAddMoney`.

- [ ] **Step 3: Keep only Details action**

Replace the action row with:

```tsx
<View style={styles.actionRow}>
  <RoundButton
    icon={'receipt-outline'}
    text={'Details'}
    onPress={onDetails}
    accentColor="#EEF2FF"
    iconColor={Colors.primary}
  />
</View>
```

- [ ] **Step 4: Remove widget section**

Delete:

```tsx
<View style={styles.sectionHeaderRow}>
  <Text style={styles.sectionHeader}>Widgets</Text>
  <Text style={styles.sectionCaption}>Hold to reorder</Text>
</View>
<WidgetList />
```

- [ ] **Step 5: Delete fake menu/widget files**

Delete:

```text
apps/frontend/Components/ui/DropDown.tsx
apps/frontend/Components/sortable-list/WidgetList.tsx
apps/frontend/Components/sortable-list/Tile.tsx
```

- [ ] **Step 6: Run Home test green**

Run:

```bash
npx jest --runTestsByPath apps/frontend/__tests__/home-ui-regressions.test.ts --runInBand --watchman=false
```

Expected: PASS.

## Task 3: Guard Cross-Screen Fake Controls

**Files:**
- Create: `apps/frontend/__tests__/product-cleanup-regressions.test.ts`

- [ ] **Step 1: Add source-level cleanup tests**

```ts
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');

const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('product cleanup regressions', () => {
  it('does not expose unimplemented login methods', () => {
    const source = read('app/login.tsx');

    expect(source).not.toContain('Continue with email');
    expect(source).not.toContain('logo-google');
    expect(source).not.toContain('logo-apple');
    expect(source).not.toContain('SignInType.Email');
    expect(source).not.toContain('SignInType.Google');
    expect(source).not.toContain('SignInType.Apple');
  });

  it('does not expose fake account modal rows', () => {
    const source = read('app/(authenticated)/(modals)/account.tsx');

    expect(source).not.toContain('>Account<');
    expect(source).not.toContain('>Learn<');
    expect(source).not.toContain('>Inbox<');
  });

  it('does not expose non-functional global header controls', () => {
    const source = read('Components/layout/CustomHeader.tsx');

    expect(source).not.toContain("placeholder='Search'");
    expect(source).not.toContain('stats-chart');
    expect(source).not.toContain('name=\"card\"');
  });
});
```

- [ ] **Step 2: Run test red**

Run:

```bash
npx jest --runTestsByPath apps/frontend/__tests__/product-cleanup-regressions.test.ts --runInBand --watchman=false
```

Expected: FAIL because login/account/header still expose fake controls.

## Task 4: Clean Login, Header, Account Modal

**Files:**
- Modify: `apps/frontend/app/login.tsx`
- Modify: `apps/frontend/Components/layout/CustomHeader.tsx`
- Modify: `apps/frontend/app/(authenticated)/(modals)/account.tsx`

- [ ] **Step 1: Remove unused login enum members**

Change:

```ts
enum SignInType {
  Phone,
  Email,
  Google,
  Apple,
}
```

To:

```ts
enum SignInType {
  Phone,
}
```

- [ ] **Step 2: Remove fake login buttons**

Delete the divider and the three `TouchableOpacity` blocks for email, Google, and Apple.

- [ ] **Step 3: Simplify header**

Replace `CustomHeader` body with a non-fake header:

```tsx
<BlurView
  intensity={80}
  tint="extraLight"
  style={{
    paddingTop: top + 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  }}
>
  <View style={styles.container}>
    <View style={styles.roundBtn}>
      <Text style={styles.initials}>SK</Text>
    </View>
    <View style={styles.titleBlock}>
      <Text style={styles.eyebrow}>Crypto simulator</Text>
      <Text style={styles.title}>Market watch</Text>
    </View>
  </View>
</BlurView>
```

Remove `TextInput`, `TouchableOpacity`, `Colors.lightGray`, and fake icon controls.

- [ ] **Step 4: Remove fake account rows**

In account modal, keep sign out row and icon selector. Delete rows with text `Account`, `Learn`, and `Inbox`.

- [ ] **Step 5: Run product cleanup test green**

Run:

```bash
npx jest --runTestsByPath apps/frontend/__tests__/product-cleanup-regressions.test.ts --runInBand --watchman=false
```

Expected: PASS.

## Task 5: Final Verification

**Files:**
- Check all modified/deleted files.

- [ ] **Step 1: Check removed labels**

Run:

```bash
rg "Exchange|Statement|Converter|Background|Add new account|Continue with email|Cashback|1024€" apps/frontend
```

Expected: no customer-facing fake feature labels remain except intentional test/spec references.

- [ ] **Step 2: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Full test suite**

Run:

```bash
npx jest --runInBand --watchman=false
```

Expected: PASS.

- [ ] **Step 4: Measurement summary**

Report:

```text
Measurement: misleading actionable controls reduced from 16 visible fake/destructive controls to 0 across Home, login, account modal, header, and widgets. Regression coverage added for Home cleanup, login cleanup, account cleanup, and header cleanup.
```
