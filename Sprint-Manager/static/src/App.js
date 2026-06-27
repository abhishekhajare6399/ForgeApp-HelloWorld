import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import { useJiraTheme } from './utils/theme.util';

function App() {
    const [data, setData] = useState(null);
    const { colorMode, isDark } = useJiraTheme();

    useEffect(() => {
        invoke('getText', { example: 'my-invoke-variable' }).then(setData);
    }, []);

    return (
        <div className="sm-app">
            <header className="sm-app__header">
                <h1 className="sm-app__title">Sprint Manager</h1>
                <p className="sm-app__subtitle">
                    Jira theme: {colorMode}
                    {isDark ? ' (dark)' : ' (light)'}
                </p>
            </header>

            <main className="sm-app__content">
                <div className="sm-card">
                    <p className="sm-text">{data ? data : 'Loading...'}</p>
                </div>
            </main>
        </div>
    );
}

export default App;
