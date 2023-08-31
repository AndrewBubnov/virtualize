import styles from './App.module.css';
import { Virtualized } from './components/Vitrualized/Virtualized.tsx';

function App() {
	return (
		<div className={styles.container}>
			<Virtualized />
		</div>
	);
}

export default App;
