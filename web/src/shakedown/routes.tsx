import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ComparePage } from '../tests/ComparePage';
import { SimulatedControlPage } from '../control/SimulatedControlPage';
import { ShakedownControlPage } from './ShakedownControlPage';
import { SHAKEDOWN_PATH, legacyTestsPath } from './paths';
import '../tests/tests.css';

/** `/shakedown/*`: Shakedown control, a branch's simulated Control workspace and a comparison. Pop-out panes are routed outside the app's bars (App.tsx). */
export function ShakedownSection() {
  return (
    <Routes>
      <Route index element={<ShakedownControlPage />} />
      <Route path="runs/:run/:branch" element={<SimulatedControlPage />} />
      <Route path="compare/:a/:b" element={<ComparePage />} />
      <Route path="*" element={<Navigate replace to={SHAKEDOWN_PATH} />} />
    </Routes>
  );
}

/** `/tests/*`, the old Tests section: each address goes to the matching Shakedown one. */
export function TestsRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate replace to={legacyTestsPath(pathname, search)} />;
}
