import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

export interface ScriptResult {
    success: boolean;
    stdout: string;
    stderr: string;
    code: number | null;
    error?: string;
    jobId: string;
}

export class PowerShellService {
    private static process: ChildProcessWithoutNullStreams | null = null;
    private static currentResolve: ((result: ScriptResult) => void) | null = null;
    private static stdoutBuffer = '';
    private static stderrBuffer = '';
    private static delimiter = '<<<END_OF_COMMAND>>>';

    private static initialize() {
        if (this.process) return;

        console.log('[PS] Initializing persistent PowerShell session...');
        this.process = spawn('powershell', ['-NoProfile', '-Command', '-'], {
            windowsHide: false
        });

        // Pre-import the management module to ensure it's loaded in the session
        this.process.stdin.write('Import-Module ExchangeOnlineManagement -ErrorAction SilentlyContinue\n');

        this.process.stdout.on('data', (data) => {
            const chunk = data.toString();
            console.log(`[PS STDOUT]: ${chunk}`);
            this.stdoutBuffer += chunk;
            this.checkOutput();
        });

        this.process.stderr.on('data', (data) => {
            const chunk = data.toString();
            console.warn(`[PS STDERR]: ${chunk}`);
            this.stderrBuffer += chunk;
        });

        this.process.on('close', (code) => {
            console.log(`[PS] Process closed with code ${code}`);
            this.process = null;
            if (this.currentResolve) {
                this.currentResolve({
                    success: false,
                    stdout: this.stdoutBuffer,
                    stderr: this.stderrBuffer || 'PowerShell process closed unexpectedly.',
                    code,
                    jobId: uuidv4()
                });
                this.currentResolve = null;
            }
        });
    }

    private static checkOutput() {
        if (this.stdoutBuffer.includes(this.delimiter)) {
            const parts = this.stdoutBuffer.split(this.delimiter);
            const output = parts[0];
            // Keep the rest in the buffer for next command
            this.stdoutBuffer = parts.slice(1).join(this.delimiter);

            if (this.currentResolve) {
                console.log(`[PS] Command finished. Output length: ${output.length}`);
                this.currentResolve({
                    success: true,
                    stdout: output.trim(),
                    stderr: this.stderrBuffer.trim(),
                    code: 0,
                    jobId: uuidv4()
                });

                this.currentResolve = null;
                this.stderrBuffer = '';
            }
        }
    }

    /**
     * Returns the current contents of the stdout/stderr buffers.
     * Useful for peeking at long-running commands like device login.
     */
    static getLiveOutput() {
        return {
            stdout: this.stdoutBuffer,
            stderr: this.stderrBuffer,
            isBusy: !!this.currentResolve
        };
    }

    /**
     * Resets the persistent PowerShell session.
     */
    static resetSession() {
        if (this.process) {
            console.log('[PS] Resetting session. Killing process...');
            this.process.kill('SIGTERM');
            this.process = null;
        }
        if (this.currentResolve) {
            this.currentResolve({
                success: false,
                stdout: this.stdoutBuffer,
                stderr: 'Session reset by user.',
                code: -1,
                jobId: uuidv4()
            });
            this.currentResolve = null;
        }
        this.stdoutBuffer = '';
        this.stderrBuffer = '';
    }

    /**
     * Executes a PowerShell script or command in the PERSISTENT session.
     * @param command The PowerShell command or script block to execute.
     * @returns Promise resolving to the execution result.
     */
    static async runScript(command: string): Promise<ScriptResult> {
        this.initialize();

        if (this.currentResolve) {
            console.warn('[PS] Busy: Rejecting command because another is running.');
            return {
                success: false,
                stdout: '',
                stderr: 'Busy: Another command is executing.',
                code: -1,
                jobId: uuidv4()
            };
        }

        return new Promise((resolve) => {
            // Add a 60-second timeout
            const timeout = setTimeout(() => {
                if (this.currentResolve === resolve) {
                    console.error('[PS] Command timeout reached (60s).');
                    resolve({
                        success: false,
                        stdout: this.stdoutBuffer.trim(),
                        stderr: (this.stderrBuffer + '\nError: Execution timed out. If you were connecting, please check for a login popup on your screen.').trim(),
                        code: -1,
                        jobId: uuidv4()
                    });
                    this.currentResolve = null;
                    this.stdoutBuffer = '';
                    this.stderrBuffer = '';
                }
            }, 60000);

            this.currentResolve = (res) => {
                clearTimeout(timeout);
                resolve(res);
            };

            const wrappedCommand = `
                $ErrorActionPreference = 'Continue'
                try {
                    ${command} | Out-String -Width 160
                } catch {
                    Write-Error $_
                } finally {
                    Write-Output "${this.delimiter}"
                }
            `;

            console.log(`[PS] Executing: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
            this.process?.stdin.write(wrappedCommand + '\n');
        });
    }
}
