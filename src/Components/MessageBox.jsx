// @ts-check

import React, { useEffect, useRef, useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import * as actions from '../storeSlices/index.js';

const actionCreators = {
  addMessage: actions.addMessage,
};

const mapStateToProps = ({
  messages, currentChannelId, currentUser, channels,
}) => ({
  messages, currentChannelId, currentUser, channels,
});

const renderMessages = (list) => {
  if (list.length === 0) {
    return null;
  }
  return list.map(({ id, username, body }) => (
    <div className="text-break mb-2" key={id}>
      <b>{username}</b>
      {': '}
      {body}
    </div>
  ));
};

const MessageBox = ({
  messages, addMessage, currentChannelId, currentUser, channels, socket,
}) => {
  const inputRef = useRef();
  const messagesEnd = useRef();
  const { t } = useTranslation();
  const [formDisabled, setFormDisabled] = useState(false);

  useEffect(() => {
    // @ts-ignore
    inputRef.current.focus();
    // @ts-ignore
    messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
  });

  const filteredMessages = messages.filter(({ channelId }) => channelId === currentChannelId);
  const currentChannel = channels.find(({ id }) => id === currentChannelId);
  const channelName = currentChannel ? currentChannel.name : '';
  const count = filteredMessages.length;
  const messagesCountToString = t('chatPage.messages.message', { count });

  const f = useFormik({
    initialValues: {
      messageText: '',
    },
    onSubmit: ({ messageText }) => {
      setFormDisabled(true);
      const newMessage = {
        body: messageText,
        channelId: currentChannelId,
        username: currentUser,
      };
      const message = { ...newMessage, id: messageText };
      addMessage({ message });
      socket.emit('newMessage', newMessage, (response) => {
        if (response.status === 'ok') {
          setFormDisabled(false);
          f.resetForm();
        }
      });
    },
  });

  return (
    <div className="col p-0 h-100">
      <div className="d-flex flex-column h-100">
        <div className="bg-light mb-4 p-3 shadow-sm small">
          <p className="m-0">
            <b>{`# ${channelName}`}</b>
          </p>
          <span className="text-muted">{messagesCountToString}</span>
        </div>
        <div id="messages-box" className="chat-messages overflow-auto px-5">
          {renderMessages(filteredMessages)}
          <div ref={messagesEnd} />
        </div>
        <div className="mt-auto px-5 py-3">
          <Form onSubmit={f.handleSubmit}>
            <InputGroup className="mb-3">
              <Form.Control
                ref={inputRef}
                type="text"
                id="messageText"
                placeholder={t('chatPage.enterMessage')}
                name="messageText"
                onChange={f.handleChange}
                value={f.values.messageText}
                disabled={formDisabled}
                data-testid="new-message"
              />
              <Button variant="outline-primary" type="submit" disabled={!f.values.messageText || formDisabled}>
                {t('chatPage.sendMessage')}
              </Button>
            </InputGroup>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default connect(mapStateToProps, actionCreators)(MessageBox);
