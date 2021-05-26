import { EventEmitter } from 'events';
import IAutozoomControl from '../../interfaces/IAutozoomControl';
import IAutozoomControlOpts from '../../interfaces/IAutozoomControlOpts';
import IDetector from '../../interfaces/IDetector';
import IDetectorOpts from '../../interfaces/IDetectorOpts';
import IDeviceUpgrader from '../../interfaces/IDeviceUpgrader';
import ITransport from '../../interfaces/iTransport';
import IUpgradeOpts from '../../interfaces/IUpgradeOpts';
import ReleaseChannel from '../../interfaces/ReleaseChannelEnum';
import Api from '../api';
import diagnosticsMessage from '../diagnosticsMessage';
import DefaultLogger from './../../utilitis/logger';
import Locksmith from './../locksmith';
import IDeviceManager from './../../interfaces/iDeviceManager';

export default class Ace implements IDeviceManager {
    transport: ITransport;
    logger: any;
    locksmith: Locksmith;
    productName: string = "Huddly L1";
    discoveryEmitter: EventEmitter;

    get api(): Api {
        throw new Error('Not Supported.');;
    }
    get uvcControlInterface() {
        throw new Error("Not Supported");
    }

    constructor(
        transport: ITransport,
        logger: DefaultLogger,
        cameraDiscoveryEmitter: EventEmitter) {

        this.transport = transport;
        this.logger = logger;
        this.locksmith = new Locksmith();
        this.discoveryEmitter = cameraDiscoveryEmitter;
      }

    async initialize(): Promise<void> {
        this.transport.init();
        try {
            this.transport.initEventLoop();
        } catch (e) {
            this.logger.error('Failed to init event loop when transport reset', e, 'Boxfish API');
        }
    }

    async closeConnection(): Promise<any> {
        return this.transport.close();
    }

    getInfo(): Promise<any> {
        throw new Error('Method not implemented.');
    }

    getErrorLog(timeout: number): Promise<any> {
        throw new Error('Method not implemented.');
    }

    eraseErrorLog(timeout: number): Promise<void> {
        throw new Error('Method not implemented.');
    }

    reboot(mode?: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    getUpgrader(): Promise<IDeviceUpgrader> {
        throw new Error('Method not implemented.');
    }

    upgrade(opts: IUpgradeOpts): Promise<any> {
        throw new Error('Method not implemented.');
    }

    getAutozoomControl(opts: IAutozoomControlOpts): IAutozoomControl {
        throw new Error('Method not implemented.');
    }

    getDetector(opts: IDetectorOpts): IDetector {
        throw new Error('Method not implemented.');
    }

    getDiagnostics(): Promise<diagnosticsMessage[]> {
        throw new Error('Method not implemented.');
    }

    getState(): Promise<any> {
        throw new Error('Method not implemented.');
    }

    getPowerUsage(): Promise<any> {
        throw new Error('Method not implemented.');
    }

    getTemperature(): Promise<any> {
        throw new Error('Method not implemented.');
    }

    getLatestFirmwareUrl(releaseChannel: ReleaseChannel) {
        throw new Error('Method not implemented.');
    }
}
