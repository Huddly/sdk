import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import fs from 'fs';

import Logger from './../../src/utilitis/logger';


chai.should();
chai.use(sinonChai);

describe('Logger', () => {
    afterEach(() => {
        delete process.env.HUDDLY_LOG_LEVEL;
        delete process.env.HUDDLY_LOG_CHANNEL;
        delete process.env.HUDDLY_LOG_FILE;
    });
    describe('log levels', () => {
        let formatLogMsgSpy;
        beforeEach(() => {
            formatLogMsgSpy = sinon.spy(Logger, 'formatLogMsg');
        });
        afterEach(() => {
            formatLogMsgSpy.restore();
        });
        describe('#info', () => {
            it('should should log messages when HUDDLY_LOG_LEVEL is INFO', () => {
                const logMsg = 'Hello World';
                process.env.HUDDLY_LOG_LEVEL = 'INFO';
                Logger.info(logMsg, 'TESTCOMPONENT');
                expect(formatLogMsgSpy.called).to.equal(true);
                expect(formatLogMsgSpy.getCall(0).args[0]).to.equal('INFO');
                expect(formatLogMsgSpy.getCall(0).args[1]).to.equal('TESTCOMPONENT');
                expect(formatLogMsgSpy.getCall(0).args[2]).to.equal(logMsg);
            });
            it('should should log messages when HUDDLY_LOG_LEVEL is DEBUG', () => {
                const logMsg = 'Hello World';
                process.env.HUDDLY_LOG_LEVEL = 'DEBUG';
                Logger.info(logMsg);
                expect(formatLogMsgSpy.called).to.equal(true);
                expect(formatLogMsgSpy.getCall(0).args[0]).to.equal('INFO');
                expect(formatLogMsgSpy.getCall(0).args[1]).to.equal('Generic Component');
                expect(formatLogMsgSpy.getCall(0).args[2]).to.equal(logMsg);
            });
            it('should not log anything when HUDDLY_LOG_LEVEL is neither INFO or DEBUG', () => {
                const logMsg = 'Hello World';
                process.env.HUDDLY_LOG_LEVEL = 'ERROR';
                Logger.info(logMsg);
                expect(formatLogMsgSpy.called).to.equal(false);
                process.env.HUDDLY_LOG_LEVEL = 'NONE';
                Logger.info(logMsg);
                expect(formatLogMsgSpy.called).to.equal(false);
            });
        });
        describe('#debug', () => {
            it('should should log messages only when HUDDLY_LOG_LEVEL is DEBUG', () => {
                const logMsg = 'Hello World';
                process.env.HUDDLY_LOG_LEVEL = 'DEBUG';
                Logger.debug(logMsg, 'TESTCOMPONENT');
                expect(formatLogMsgSpy.called).to.equal(true);
                expect(formatLogMsgSpy.getCall(0).args[0]).to.equal('DEBUG');
                expect(formatLogMsgSpy.getCall(0).args[1]).to.equal('TESTCOMPONENT');
                expect(formatLogMsgSpy.getCall(0).args[2]).to.equal(logMsg);
            });
            it('should not log anything when HUDDLY_LOG_LEVEL is not DEBUG', () => {
                const logMsg = 'Hello World';
                process.env.HUDDLY_LOG_LEVEL = 'ERROR';
                Logger.debug(logMsg);
                expect(formatLogMsgSpy.called).to.equal(false);
                process.env.HUDDLY_LOG_LEVEL = 'INFO';
                Logger.debug(logMsg);
                expect(formatLogMsgSpy.called).to.equal(false);
                process.env.HUDDLY_LOG_LEVEL = 'NONE';
                Logger.debug(logMsg);
                expect(formatLogMsgSpy.called).to.equal(false);
            });
        });
        describe('#warn', () => {
            it('should should log messages only when HUDDLY_LOG_LEVEL is DEBUG', () => {
                const logMsg = 'Hello World';
                process.env.HUDDLY_LOG_LEVEL = 'DEBUG';
                Logger.warn(logMsg, 'TESTCOMPONENT');
                expect(formatLogMsgSpy.called).to.equal(true);
                expect(formatLogMsgSpy.getCall(0).args[0]).to.equal('WARN');
                expect(formatLogMsgSpy.getCall(0).args[1]).to.equal('TESTCOMPONENT');
                expect(formatLogMsgSpy.getCall(0).args[2]).to.equal(logMsg);
            });
            it('should not log anything when HUDDLY_LOG_LEVEL is not DEBUG', () => {
                const logMsg = 'Hello World';
                process.env.HUDDLY_LOG_LEVEL = 'ERROR';
                Logger.warn(logMsg);
                expect(formatLogMsgSpy.called).to.equal(false);
                process.env.HUDDLY_LOG_LEVEL = 'INFO';
                Logger.warn(logMsg);
                expect(formatLogMsgSpy.called).to.equal(false);
                process.env.HUDDLY_LOG_LEVEL = 'NONE';
                Logger.warn(logMsg);
                expect(formatLogMsgSpy.called).to.equal(false);
            });
        });
        describe('#error', () => {
            let consoleLogSpy;
            beforeEach(() => {
                consoleLogSpy = sinon.spy(console, 'log');
            });
            afterEach(() => {
                consoleLogSpy.restore();
            });
            it('should log errors by default', () => {
                const logMsg = 'Hello World';
                const stackTrace = 'Opppps';
                Logger.error(logMsg, stackTrace, 'TESTCOMPONENT');
                expect(formatLogMsgSpy.called).to.equal(true);
                expect(formatLogMsgSpy.getCall(0).args[0]).to.equal('ERROR');
                expect(formatLogMsgSpy.getCall(0).args[1]).to.equal('TESTCOMPONENT');
                expect(formatLogMsgSpy.getCall(0).args[2]).to.equal(logMsg);
                expect(consoleLogSpy.called).to.equal(true);
                expect(consoleLogSpy.getCall(1).args[0]).to.equal(stackTrace);
            });
            it('should log errors by when HUDDLY_LOG_LEVEL is set to INFO,DEBUG,ERROR', () => {
                let i = 0;
                let logMsg = `Hello World ${i}`;
                ['DEBUG', 'INFO', 'ERROR'].forEach((level: string) => {
                    process.env.HUDDLY_LOG_LEVEL = level;
                    Logger.error(logMsg, '');
                    expect(formatLogMsgSpy.called).to.equal(true);
                    expect(formatLogMsgSpy.getCall(i).args[0]).to.equal('ERROR');
                    expect(formatLogMsgSpy.getCall(i).args[1]).to.equal('Generic Component');
                    expect(formatLogMsgSpy.getCall(i).args[2]).to.equal(logMsg);
                    i += 1;
                    logMsg = `Hello World ${i}`;
                });
            });
            it('should not log errors when HUDDLY_LOG_LEVEL is NONE', () => {
                const logMsg = 'Hello World';
                process.env.HUDDLY_LOG_LEVEL = 'NONE';
                Logger.warn(logMsg);
                expect(formatLogMsgSpy.called).to.equal(false);
            });
        });
    });

    describe('#redirectLogMsg', () => {
        let consoleLogSpy, fsAppendFileSyncStub;
        beforeEach(() => {
            consoleLogSpy = sinon.spy(console, 'log');
            fsAppendFileSyncStub = sinon.stub(fs, 'appendFileSync');
        });
        afterEach(() => {
            consoleLogSpy.restore();
            fsAppendFileSyncStub.restore();
        });
        it('should log to console by default', () => {
            const logMsg = 'Hello World';
            Logger.redirectLogMsg(logMsg);
            expect(consoleLogSpy.called).to.equal(true);
            expect(fsAppendFileSyncStub.called).to.equal(false);
            expect(consoleLogSpy.getCall(0).args[0]).to.equal(logMsg);
        });
        it('should log to default file when HUDDLY_LOG_CHANNEL is set to FILE', () => {
            const logMsg = 'Hello World';
            process.env.HUDDLY_LOG_CHANNEL = 'FILE';
            Logger.redirectLogMsg(logMsg);
            expect(fsAppendFileSyncStub.called).to.equal(true);
            expect(fsAppendFileSyncStub.getCall(0).args[0]).to.equal('huddlysdk.log');
            expect(fsAppendFileSyncStub.getCall(0).args[1]).to.equal(`${logMsg}\n`);
        });
        it('should log to custom file when HUDDLY_LOG_CHANNEL is set to FILE', () => {
            const logMsg = 'Hello World';
            process.env.HUDDLY_LOG_CHANNEL = 'FILE';
            process.env.HUDDLY_LOG_FILE = 'mylog.log';
            Logger.redirectLogMsg(logMsg);
            expect(fsAppendFileSyncStub.called).to.equal(true);
            expect(fsAppendFileSyncStub.getCall(0).args[0]).to.equal('mylog.log');
            expect(fsAppendFileSyncStub.getCall(0).args[1]).to.equal(`${logMsg}\n`);
        });
    });
    /* describe('#formatDate');
    describe('#getTime');
    describe('#formatLogMsg'); */
});
