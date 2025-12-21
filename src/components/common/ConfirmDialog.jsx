import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, DialogContentText, useTheme, useMediaQuery, Stack } from '@mui/material';
import { WarningAmber as WarningIcon, CheckCircle as ConfirmIcon } from '@mui/icons-material';

/*
  Component: `ConfirmDialog`

  Mô tả:
  - Hộp thoại xác nhận tái sử dụng được cho các thao tác nguy hiểm (xóa, gỡ, v.v.).
  - Props chính: `open`, `title`, `description`, `confirmText`, `cancelText`, `onClose`, `onConfirm`, `destructive`.
  - Tự động suy đoán `destructive` nếu không truyền (dựa trên nội dung có chứa từ khóa như "xóa").
  - Responsive: chuyển sang `fullScreen` trên màn hình nhỏ.
*/

export default function ConfirmDialog({
  open,
  title = 'Xác nhận',
  description = '',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onClose,
  onConfirm,
  destructive = undefined,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClose = (confirmed) => {
    if (onClose) onClose(confirmed);
  };

  // If caller didn't specify destructive flag, infer from wording (e.g. "xóa" / "delete").
  const inferDestructive = (destructive === undefined) ? /xóa|xoá|delete|remove|delete/i.test((title + ' ' + description + ' ' + confirmText)) : destructive;

  return (
    <Dialog
      open={open}
      onClose={() => handleClose(false)}
      fullWidth
      maxWidth="xs"
      fullScreen={fullScreen}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        <Stack direction="row" spacing={1} alignItems="center">
          {inferDestructive ? <WarningIcon sx={{ color: theme.palette.error.main }} /> : <ConfirmIcon sx={{ color: theme.palette.primary.main }} />}
          <Typography variant="h6">{title}</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {description ? (
          <DialogContentText id="confirm-dialog-description" sx={{ whiteSpace: 'pre-wrap' }}>{description}</DialogContentText>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => handleClose(false)} variant="outlined" color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={async () => { if (onConfirm) await onConfirm(); handleClose(true); }}
          variant="contained"
          color={inferDestructive ? 'error' : 'primary'}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
