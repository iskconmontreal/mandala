import { ICONS as heroicons } from './icons.heroicons.js'

export const ACTIVE_ICON_SET = 'heroicons'
export const ICONS = heroicons

export const icon = (name, fallback = '') => ICONS[name] || fallback

export const actionIcon = name => icon(`action_${name}`, ICONS.action_edit)
export const activityIcon = badge => icon(`activity_${badge}`, ICONS.activity_update)
export const statusIcon = status => icon(`status_${status}`, '')
export const methodIcon = method => icon(`method_${method}`, ICONS.method_cash)
export const trendIcon = dir => icon(`trend_${dir}`, '')
