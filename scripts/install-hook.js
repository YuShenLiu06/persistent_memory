#!/usr/bin/env node

/**
 * Stop Hook 安装脚本
 *
 * 用于将 persistent-context stop hook 注入到 .claude/settings.local.json
 *
 * 功能：
 * - 检查并创建 settings.local.json（如不存在）
 * - 检查并创建 hooks.Stop 数组（如不存在）
 * - 检查并添加 stop hook（如不存在）
 * - 支持重复运行（幂等性）
 * - 自动备份原有配置
 *
 * 使用：
 * node scripts/install-hook.js [options]
 *
 * 选项：
 * --dry-run    预览更改，不实际修改文件
 * --force      强制重新安装（即使已存在）
 * --verbose    显示详细输出
 * --help       显示帮助信息
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 配置常量
// ============================================================================

const STOP_HOOK_CONFIG = {
  matcher: '',
  hooks: [
    {
      type: 'prompt',
      prompt: '根据是否主动更新文档(执行/persistent-context)了评判此轮会话是否应该结束，概论对话状况如下: $ARGUMENTS. 如果有设计函数类型，参数，方法、用户偏好、项目偏好、新增函数、功能等内容没有被即使更新至文档，分析过后判断是否能退出，如果可以退出回复以下json内容“{\"ok\": true, \"reason\": \"文档已经最新\"}”如果需要更新的话回复“{\"ok\": false, \"reason\": \"/persistent-context <需要更新的部分>\"}不要回复以外的任何词语，同时也不要解释'
    }
  ]
};

const SETTINGS_FILE_NAME = 'settings.local.json';
const CLAUDE_DIR_NAME = '.claude';

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 日志输出工具
 */
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`),
  debug: (msg, verbose) => verbose && console.log(`[DEBUG] ${msg}`)
};

/**
 * 解析命令行参数
 * @returns {Object} 解析后的参数对象
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    verbose: args.includes('--verbose'),
    help: args.includes('--help') || args.includes('-h')
  };
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
Stop Hook 安装脚本

用法:
  node scripts/install-hook.js [options]

选项:
  --dry-run     预览更改，不实际修改文件
  --force       强制重新安装（即使已存在）
  --verbose     显示详细输出
  -h, --help    显示此帮助信息

示例:
  node scripts/install-hook.js              # 正常安装
  node scripts/install-hook.js --dry-run    # 预览更改
  node scripts/install-hook.js --force      # 强制重新安装
  node scripts/install-hook.js --verbose    # 显示详细信息
`);
}

/**
 * 查找 settings.local.json 文件路径
 * @param {string} startDir - 起始目录
 * @returns {string|null} 文件路径或 null
 */
function findSettingsFile(startDir) {
  let currentDir = startDir;

  while (currentDir !== path.dirname(currentDir)) {
    const claudeDir = path.join(currentDir, CLAUDE_DIR_NAME);
    const settingsPath = path.join(claudeDir, SETTINGS_FILE_NAME);

    if (fs.existsSync(settingsPath)) {
      return settingsPath;
    }

    // 也检查 .claude 目录是否存在（即使没有 settings.local.json）
    if (fs.existsSync(claudeDir)) {
      return settingsPath; // 返回应该创建的路径
    }

    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * 获取默认的空配置结构
 * @returns {Object} 默认配置对象
 */
function getDefaultSettings() {
  return {
    permissions: {
      allow: []
    },
    hooks: {
      Stop: []
    }
  };
}

/**
 * 检查 hook 是否已存在
 * @param {Array} stopHooks - Stop hooks 数组
 * @param {Object} targetHook - 目标 hook
 * @returns {boolean} 是否存在
 */
function hookExists(stopHooks, targetHook) {
  if (!Array.isArray(stopHooks)) return false;

  return stopHooks.some(hookGroup => {
    if (!hookGroup.hooks || !Array.isArray(hookGroup.hooks)) {
      return false;
    }

    return hookGroup.hooks.some(hook =>
      hook.type === targetHook.hooks[0].type &&
      hook.prompt === targetHook.hooks[0].prompt
    );
  });
}

/**
 * 备份文件
 * @param {string} filePath - 文件路径
 * @returns {string|null} 备份文件路径或 null
 */
function backupFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;

  try {
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (err) {
    logger.warn(`无法创建备份文件: ${err.message}`);
    return null;
  }
}

/**
 * 读取并解析 JSON 文件
 * @param {string} filePath - 文件路径
 * @returns {Object} 解析后的对象
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // 文件不存在
    }
    throw new Error(`无法解析 JSON 文件: ${err.message}`);
  }
}

/**
 * 安全写入 JSON 文件
 * @param {string} filePath - 文件路径
 * @param {Object} data - 要写入的数据
 */
function writeJsonFile(filePath, data) {
  const dirPath = path.dirname(filePath);

  // 确保目录存在
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // 格式化 JSON（2空格缩进）
  const content = JSON.stringify(data, null, 2);

  // 写入文件
  fs.writeFileSync(filePath, content, 'utf8');
}

// ============================================================================
// 主逻辑
// ============================================================================

/**
 * 安装 hook
 * @param {Object} options - 选项
 * @returns {boolean} 是否成功
 */
function installHook(options) {
  const { dryRun, force, verbose } = options;

  logger.info('开始安装 Stop Hook...');
  logger.debug(`选项: dryRun=${dryRun}, force=${force}, verbose=${verbose}`, verbose);

  // 1. 查找 settings.local.json 文件
  const cwd = process.cwd();
  let settingsPath = findSettingsFile(cwd);

  if (!settingsPath) {
    // 如果找不到，在当前目录的 .claude 下创建
    settingsPath = path.join(cwd, CLAUDE_DIR_NAME, SETTINGS_FILE_NAME);
    logger.info(`未找到现有配置，将在以下位置创建: ${settingsPath}`);
  } else {
    logger.info(`找到配置文件: ${settingsPath}`);
  }

  // 2. 读取现有配置
  let settings = readJsonFile(settingsPath);
  const isNewFile = settings === null;

  if (isNewFile) {
    logger.info('创建新的配置文件...');
    settings = getDefaultSettings();
  } else {
    logger.debug('现有配置加载成功', verbose);
    logger.debug(`现有配置: ${JSON.stringify(settings, null, 2)}`, verbose);
  }

  // 3. 确保 hooks.Stop 数组存在
  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (!settings.hooks.Stop) {
    settings.hooks.Stop = [];
    logger.info('创建 hooks.Stop 数组');
  }

  // 4. 检查 hook 是否已存在
  const alreadyExists = hookExists(settings.hooks.Stop, STOP_HOOK_CONFIG);

  if (alreadyExists && !force) {
    logger.warn('Stop Hook 已存在，跳过安装。使用 --force 选项强制重新安装。');
    return true;
  }

  if (alreadyExists && force) {
    logger.info('强制重新安装模式，将移除现有 hook...');
    // 移除现有的相同 hook
    settings.hooks.Stop = settings.hooks.Stop.filter(hookGroup => {
      if (!hookGroup.hooks) return true;
      hookGroup.hooks = hookGroup.hooks.filter(hook =>
        !(hook.type === STOP_HOOK_CONFIG.hooks[0].type &&
          hook.prompt === STOP_HOOK_CONFIG.hooks[0].prompt)
      );
      return hookGroup.hooks.length > 0;
    });
  }

  // 5. 添加新的 hook
  settings.hooks.Stop.push(STOP_HOOK_CONFIG);
  logger.info('添加 Stop Hook 到配置');

  // 6. 预览模式
  if (dryRun) {
    logger.info('=== 预览模式 - 不会修改文件 ===');
    console.log('\n更新后的配置:');
    console.log(JSON.stringify(settings, null, 2));
    logger.info('=== 预览结束 ===');
    return true;
  }

  // 7. 备份现有文件
  if (!isNewFile) {
    const backupPath = backupFile(settingsPath);
    if (backupPath) {
      logger.info(`已创建备份: ${backupPath}`);
    }
  }

  // 8. 写入新配置
  try {
    writeJsonFile(settingsPath, settings);
    logger.success(`配置已成功写入: ${settingsPath}`);

    // 显示最终配置
    if (verbose) {
      console.log('\n最终配置:');
      console.log(JSON.stringify(settings, null, 2));
    }

    return true;
  } catch (err) {
    logger.error(`写入配置失败: ${err.message}`);
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  try {
    const success = installHook(options);
    process.exit(success ? 0 : 1);
  } catch (err) {
    logger.error(`安装失败: ${err.message}`);
    if (options.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// 执行主函数
main();
