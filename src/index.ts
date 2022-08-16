import joplin from 'api';
import { SettingItemType , ToolbarButtonLocation, MenuItemLocation, ContentScriptType } from 'api/types';


const CONTENT_SCRIPT_FILE_NAME = 'formatpainter.js';
const CONTENT_SCRIPT_ID        = 'format-painter-script';
const CODEMIRROR_TOGGLE_COMMAND= 'toggleFormatPainter'; 
const CODEMIRROR_GETSELECT     = 'getSel';

const COMMAND_TOGGLE_NAME      = 'toggle-painter';
const COMMAND_TOGGLE_LABEL     = 'Toggle Format Painter';
const MENU_TOGGLE_ID           = 'toggle.format.painter';
const BUTTON_TOGGLE_ID         = 'toggle_format_painter';

const SETTING_SECTION_ID       = 'settings.formatpainter';
const SETTING_LABEL            = 'Format Painter';
const SETTING_FORE             = 'foretext';
const SETTING_FORE_LABEL       = 'add before the text';

const SETTING_END              = 'endtext';
const SETTING_END_LABEL        = 'add after the text';
const COMMAND_QS_L_NAME        = 'quick-setting-L';
const COMMAND_QS_L_LABEL       = 'Format painter quick setting foretext';

const COMMAND_QS_R_NAME        = 'quick-setting-R';
const COMMAND_QS_R_LABEL       = 'Format painter quick setting endtext';
const MENU_QS_L_ID             = 'quick.setting.L';
const MENU_QS_R_ID             = 'quick.setting.R';

const ICON                     = 'fas fa-paint-roller';
const HOTKEY_TOGGLE            = 'Ctrl+Shift+C';
const HOTKEY_QS_L              = 'Ctrl+Alt+,';
const HOTKEY_QS_R              = 'Ctrl+Alt+.';


let   toggled = false;
joplin.plugins.register({
	onStart: async function() {
		await joplin.settings.registerSection(SETTING_SECTION_ID, {
			label: SETTING_LABEL,
		});

		await joplin.settings.registerSettings({
			'foretext': {
				value: "",
				type: SettingItemType.String,
				section: SETTING_SECTION_ID,
				public: true,
				label: SETTING_FORE_LABEL
			},
			'endtext': {
				value: "",
				type: SettingItemType.String,
				section: SETTING_SECTION_ID,
				public: true,
				label: SETTING_END_LABEL
			}
		});


		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			CONTENT_SCRIPT_ID,
			'./' + CONTENT_SCRIPT_FILE_NAME
		);

		await joplin.commands.register({
			name: COMMAND_TOGGLE_NAME,
			label: COMMAND_TOGGLE_LABEL,
			iconName: ICON,
			execute: async () => {
				await joplin.commands.execute('editor.execCommand', {
					name: CODEMIRROR_TOGGLE_COMMAND,
					args: [await joplin.settings.value(SETTING_FORE),await joplin.settings.value(SETTING_END),toggle()] 
				});
			},
		});

		await joplin.commands.register({
			name: COMMAND_QS_L_NAME,
			label:COMMAND_QS_L_LABEL,
			execute: async ()=> {
				await joplin.commands.execute('editor.execCommand', {
					name: CODEMIRROR_GETSELECT,
					args: [false] 
				});
			}
		});

		await joplin.commands.register({
			name: COMMAND_QS_R_NAME,
			label:COMMAND_QS_R_LABEL,
			execute: async ()=> {
				await joplin.commands.execute('editor.execCommand', {
					name: CODEMIRROR_GETSELECT,
					args: [true] 
				});
				
			}
		});


		await joplin.views.toolbarButtons.create(BUTTON_TOGGLE_ID, COMMAND_TOGGLE_NAME, ToolbarButtonLocation.EditorToolbar);

		await joplin.views.menuItems.create(MENU_TOGGLE_ID, COMMAND_TOGGLE_NAME, MenuItemLocation.Edit, 
		{ accelerator: HOTKEY_TOGGLE});
		
		await joplin.views.menuItems.create(
			MENU_QS_L_ID, COMMAND_QS_L_NAME, MenuItemLocation.Edit,
			{ accelerator: HOTKEY_QS_L }
		);
		await joplin.views.menuItems.create(
			MENU_QS_R_ID, COMMAND_QS_R_NAME, MenuItemLocation.Edit,
			{ accelerator: HOTKEY_QS_R }
		);


		await joplin.contentScripts.onMessage(CONTENT_SCRIPT_ID, async (message:any)=> {
			if (message.name === 'getSel_l' ) await joplin.settings.setValue(SETTING_FORE, message.key);
			else if (message.name === 'getSel_r') await joplin.settings.setValue(SETTING_END, message.key);
			return "";
		});

		function toggle(){
			toggled = !toggled;
			return toggled;
		}
	}
});

