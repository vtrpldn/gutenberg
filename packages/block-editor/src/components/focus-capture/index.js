/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { getBlockFocusableWrapper } from '../../utils/dom';

function selector( select ) {
	const {
		isNavigationMode,
		getBlockSelectionStart,
	} = select( 'core/block-editor' );
	return {
		clientId: getBlockSelectionStart(),
		isNavigationMode: isNavigationMode(),
	};
}

function FocusCaptureElement( { reverse } ) {
	const { clientId, isNavigationMode } = useSelect( selector, [] );

	function onFocus() {
		const wrapper = getBlockFocusableWrapper( clientId );

		if ( reverse ) {
			const tabbables = focus.tabbable.find( wrapper );
			last( tabbables ).focus();
		} else {
			wrapper.focus();
		}
	}

	return (
		<div
			tabIndex={ clientId && ! isNavigationMode ? '0' : undefined }
			onFocus={ onFocus }
			style={ { position: 'fixed' } }
		/>
	);
}

/**
 * Renders focus capturing areas before and after `children` to redirect focus
 * to the selected block if not in navigation mode.
 *
 * @param {Object} props          Component props.
 * @param {Array}  props.children Children to render.
 *
 * @return {WPElement} The element tree.
 */
export default function FocusCapture( { children } ) {
	return (
		<>
			<FocusCaptureElement />
			{ children }
			<FocusCaptureElement reverse />
		</>
	);
}
