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
			tabbables[ tabbables.length - 1 ].focus();
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

export default function FocusCapture( { children } ) {
	return (
		<>
			<FocusCaptureElement />
			{ children }
			<FocusCaptureElement reverse />
		</>
	);
}
