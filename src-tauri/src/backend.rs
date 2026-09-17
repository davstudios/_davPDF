use crate::core::{result, ActionOptions, ActionResult};
use lopdf::Document;

#[tauri::command]
pub fn run_action(action: String, paths: Vec<String>, _options: ActionOptions) -> ActionResult {
    if action != "inspect" { return result(false,"Preview feature","This PDF-writing workflow is not enabled in v0.1.0 while reliability is being validated",action); }
    if paths.is_empty() { return result(false,"PDF required","Choose one or more PDF files",String::new()); }
    let mut lines = Vec::new();
    for path in paths {
        match Document::load(&path) {
            Ok(doc) => lines.push(format!("{} · {} pages", path, doc.get_pages().len())),
            Err(error) => lines.push(format!("{} · ERROR · {}", path, error))
        }
    }
    result(true,"PDF inspection completed","Local PDF structure inspected",lines.join("\n"))
}
