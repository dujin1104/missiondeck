// 仅桌面入口：初始化 Tauri 并挂载 SQLite / Dialog 插件
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// 将文本写入用户选定的文件路径（用于「导出为 JSON 文件」的原生保存对话框）
#[tauri::command]
fn write_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

/// 读取用户选定的文件内容（用于「数据导入」的原生打开对话框）
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![write_file, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
