import { createOrderTypeButton } from '../../shared/ui/OrderTypeButton.js';
import { currentOrderType, setOrderType } from '../../features/order-type/model.js';

export const renderOrderTypeWidget = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.gap = '8px';
    container.style.marginBottom = '15px';
    container.style.position = 'relative';
    container.style.zIndex = '2000';

    const types = [
        { id: 'DINE_IN', label: 'Dine-In' },
        { id: 'TAKEAWAY', label: 'Takeaway' },
        { id: 'COUNTER', label: 'Counter Sale' }
    ];

    types.forEach(type => {
        const isActive = currentOrderType === type.id;
        const btn = createOrderTypeButton(type.id, type.label, isActive, (newType) => {
            setOrderType(newType);
            renderOrderTypeWidget(containerId); // Re-render to update active state
        });
        container.appendChild(btn);
    });
};
