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
const SETTING_PREFIX            = 'prefix';
const SETTING_PREFIX_LABEL       = 'Set Prefix';

const SETTING_SUFFIX              = 'suffix';
const SETTING_SUFFIX_LABEL        = 'Set Suffix';
const COMMAND_QS_L_NAME        = 'quick-setting-L';
const COMMAND_QS_L_LABEL       = 'Format painter quick setting prefix';

const COMMAND_QS_R_NAME        = 'quick-setting-R';
const COMMAND_QS_R_LABEL       = 'Format painter quick setting suffix';
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
			'prefix': {
				value: "",
				type: SettingItemType.String,
				section: SETTING_SECTION_ID,
				public: true,
				label: SETTING_PREFIX_LABEL,
				description:"Quick Setting " + HOTKEY_QS_L
			},
			'suffix': {
				value: "",
				type: SettingItemType.String,
				section: SETTING_SECTION_ID,
				public: true,
				label: SETTING_SUFFIX_LABEL,
				description:"Quick Setting " + HOTKEY_QS_R
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
					args: [await joplin.settings.value(SETTING_PREFIX),await joplin.settings.value(SETTING_SUFFIX),toggle()] 
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
			if (message.name === 'getSel_l' ) await joplin.settings.setValue(SETTING_PREFIX, message.key);
			else if (message.name === 'getSel_r') await joplin.settings.setValue(SETTING_SUFFIX, message.key);
			return "";
		});

		function toggle(){
			toggled = !toggled;
			return toggled;
		}
	}
});

