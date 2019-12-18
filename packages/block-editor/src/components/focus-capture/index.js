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

function FocusCaptureElement( { clientId, reverse } ) {
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
			tabIndex="0"
			onFocus={ onFocus }
			style={ { position: 'fixed' } }
		/>
	);
}

export default function FocusCapture( { children } ) {
	const { clientId, isNavigationMode } = useSelect( selector, [] );

	if ( ! clientId || isNavigationMode ) {
		return children;
	}

	return (
		<>
			<FocusCaptureElement clientId={ clientId } />
			{ children }
			<FocusCaptureElement clientId={ clientId } reverse />
		</>
	);
}
