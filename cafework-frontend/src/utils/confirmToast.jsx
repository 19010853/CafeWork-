import toast from 'react-hot-toast';

export const confirmToast = ({
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
}) => {
    return toast.custom(
        (t) => (
            <div className="cw-toast cw-toast--confirm" role="alert" aria-live="polite">
                <div className="cw-toast__message">{message}</div>
                <div className="cw-toast__actions">
                    <button
                        type="button"
                        className="cw-toast__btn cw-toast__btn--cancel"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className="cw-toast__btn cw-toast__btn--confirm"
                        onClick={() => {
                            toast.dismiss(t.id);
                            onConfirm?.();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        ),
        {
            duration: Infinity,
            id: 'cw-confirm-toast',
            position: 'top-center',
        }
    );
};
