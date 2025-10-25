import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const jsonData = await request.json();
    
    // Python 脚本路径
    const pythonScriptPath = path.join(process.cwd(), 'public', 'simple_calc.py');
    
    // 调用 Python 脚本
    const result = await callPythonScript(pythonScriptPath, jsonData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Damage calculator API error:', error);
    return NextResponse.json(
      { error: `Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function callPythonScript(scriptPath: string, inputData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // 启动 Python 进程
    const pythonProcess = spawn('python', [scriptPath, '--json'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    // 收集输出
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // 处理进程结束
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script stderr:', stderr);
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // 解析 JSON 输出
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseError) {
        console.error('Failed to parse Python script output:', stdout);
        reject(new Error(`Failed to parse Python output: ${parseError}`));
      }
    });

    // 处理进程错误
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });

    // 发送输入数据
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
}