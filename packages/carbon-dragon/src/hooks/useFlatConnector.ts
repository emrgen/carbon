import { useMemo } from "react";
import { NodeConnector } from '../types';

export const useConnectorsToProps = (connector: NodeConnector) => {
	const props = useMemo(() => {
		return {...connector.listeners, ...connector.attributes}
	}, [connector])
	return props;
}
